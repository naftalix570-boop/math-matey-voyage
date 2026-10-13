<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Persist first-time setup as `name → auth/personal code → placement test`, so OAuth returns resume safely without losing the entered name.
- Actions returning immediate rewards must compute from and synchronously update the profile ref before scheduling React state, so callers receive the actual reward rather than a deferred placeholder.
- Chest opening controls share one luck selector and pass an explicit choice into the opening action, keeping inventory consumption consistent across shop and chest screens.
