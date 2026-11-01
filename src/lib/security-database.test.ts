import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

let db: PGlite;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT current_setting('app.user_id',true)::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    CREATE TABLE profiles(user_id uuid PRIMARY KEY,display_name text NOT NULL DEFAULT 'שחקן',score integer DEFAULT 0,data jsonb DEFAULT '{}');
    CREATE TABLE player_scores(user_id uuid PRIMARY KEY,score integer DEFAULT 0);
    CREATE TABLE guest_players(code text PRIMARY KEY,display_name text NOT NULL DEFAULT 'שחקן',data jsonb NOT NULL DEFAULT '{}');
    CREATE TABLE rate_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text,key text,created_at timestamptz DEFAULT now());
    CREATE TABLE admin_grants(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,reward_type text,amount integer,applied boolean DEFAULT false);
    GRANT SELECT,UPDATE ON admin_grants TO authenticated;
    ALTER TABLE admin_grants ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_grants ON admin_grants TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND applied=true);
    CREATE VIEW leaderboard_all AS SELECT code FROM guest_players;
    GRANT SELECT ON leaderboard_all TO anon,authenticated;
    CREATE TABLE promo_codes(code text PRIMARY KEY,reward_type text,amount integer,max_uses integer,uses integer DEFAULT 0);
    CREATE TABLE promo_redemptions(code text REFERENCES promo_codes(code),user_id uuid,PRIMARY KEY(code,user_id));
  `);
  await db.exec(readFileSync("drizzle/migrations/0015_admin_guard_promo_atomic_guest_safety.sql", "utf8"));
  await db.exec(readFileSync("drizzle/migrations/0016_child_safe_display_names.sql", "utf8"));
}, 30_000);
afterEach(async () => { await db.close(); });
const uid1 = "00000000-0000-4000-8000-000000000001";
const uid2 = "00000000-0000-4000-8000-000000000002";

describe("atomic promo capacity", () => {
  it("allows exactly one parallel redemption when max_uses is 1", async () => {
    await db.exec("INSERT INTO promo_codes VALUES('LAST','coins',100,1,0)");
    const results = await Promise.allSettled([
      db.query("SELECT * FROM redeem_promo_atomic($1,'LAST')", [uid1]),
      db.query("SELECT * FROM redeem_promo_atomic($1,'LAST')", [uid2]),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await db.query("SELECT uses FROM promo_codes")).rows).toEqual([{ uses: 1 }]);
    expect((await db.query("SELECT count(*)::int n FROM promo_redemptions")).rows).toEqual([{ n: 1 }]);
  });
  it("rolls back the use increment when duplicate redemption insertion fails", async () => {
    await db.exec("INSERT INTO promo_codes VALUES('TWICE','coins',100,3,0)");
    await db.query("SELECT * FROM redeem_promo_atomic($1,'TWICE')", [uid1]);
    await expect(db.query("SELECT * FROM redeem_promo_atomic($1,'TWICE')", [uid1])).rejects.toThrow();
    expect((await db.query("SELECT uses FROM promo_codes")).rows).toEqual([{ uses: 1 }]);
  });
});

describe("admin limits and privileges", () => {
  it("blocks after 5 failures in 15 minutes for one IP", async () => {
    for (let i = 0; i < 5; i++) await db.query("SELECT authorize_admin_attempt('ip',false)");
    expect((await db.query("SELECT authorize_admin_attempt('ip',true) allowed")).rows).toEqual([{ allowed: false }]);
    expect((await db.query("SELECT authorize_admin_attempt('other',true) allowed")).rows).toEqual([{ allowed: true }]);
  });
  it("blocks globally at 100 failures, including a different IP", async () => {
    await db.exec("INSERT INTO rate_events(kind,key) SELECT 'admin_failure','ip-'||n FROM generate_series(1,100) n");
    expect((await db.query("SELECT authorize_admin_attempt('new-ip',true) allowed")).rows).toEqual([{ allowed: false }]);
  });
  it("does not count failures older than 15 minutes", async () => {
    await db.exec("INSERT INTO rate_events(kind,key,created_at) SELECT 'admin_failure','ip',now()-interval '16 minutes' FROM generate_series(1,5)");
    expect((await db.query("SELECT authorize_admin_attempt('ip',true) allowed")).rows).toEqual([{ allowed: true }]);
  });
  it("allows only applied updates, not changes to reward amount or type", async () => {
    await db.query("INSERT INTO admin_grants(user_id,reward_type,amount) VALUES($1,'coins',10)", [uid1]);
    await db.exec(`SET app.user_id='${uid1}'; SET ROLE authenticated;`);
    await expect(db.exec("UPDATE admin_grants SET amount=100000,applied=true")).rejects.toThrow();
    await expect(db.exec("UPDATE admin_grants SET reward_type='trophies',applied=true")).rejects.toThrow();
    await db.exec("UPDATE admin_grants SET applied=true; RESET ROLE");
    expect((await db.query("SELECT amount,reward_type,applied FROM admin_grants")).rows).toEqual([{ amount: 10, reward_type: "coins", applied: true }]);
  });
  it("revokes access to the deprecated view from anonymous users", async () => {
    await db.exec("SET ROLE anon");
    await expect(db.query("SELECT * FROM leaderboard_all")).rejects.toThrow();
  });
  it("keeps privileged promo and admin functions inaccessible to users", async () => {
    await db.exec("SET ROLE authenticated");
    await expect(db.query("SELECT authorize_admin_attempt('ip',true)")).rejects.toThrow();
    await expect(db.query("SELECT * FROM redeem_promo_atomic($1,'CODE')", [uid1])).rejects.toThrow();
  });
});

it("cleans events older than two days but keeps recent events", async () => {
  await db.exec("INSERT INTO rate_events(kind,key,created_at) VALUES('test','old',now()-interval '49 hours'),('test','recent',now()-interval '47 hours')");
  expect((await db.query("SELECT key FROM rate_events")).rows).toEqual([{ key: "recent" }]);
});
it("enforces the guest JSON object and 64 KB limit at the database boundary", async () => {
  await expect(db.query("INSERT INTO guest_players(code,data) VALUES('bad',$1)", [JSON.stringify([])])).rejects.toThrow();
  await expect(db.query("INSERT INTO guest_players(code,data) VALUES('big',$1)", [JSON.stringify({ s: "x".repeat(65536) })])).rejects.toThrow();
  await db.query("INSERT INTO guest_players(code,data) VALUES('valid',$1)", [JSON.stringify({ coins: 120 })]);
});
it("blocks unsafe player and guest names on direct writes while retaining unchanged legacy names", async () => {
  for (const name of ["זונה", "fuck", "example.com", "050-1234567"]) {
    await expect(db.query("INSERT INTO guest_players(code,display_name) VALUES('bad',$1)", [name])).rejects.toThrow();
    await expect(db.query("INSERT INTO profiles(user_id,display_name) VALUES($1,$2)", [uid1, name])).rejects.toThrow();
  }
  await db.query("INSERT INTO profiles(user_id,display_name) VALUES($1,'נפתלי')", [uid1]);
  await db.query("UPDATE profiles SET data='{}' WHERE user_id=$1", [uid1]);
});