/** Non-commercial notice and attribution, shown on every page. */
export function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-6 text-center text-xs leading-5 text-faint sm:px-6">
      <p className="mx-auto max-w-3xl">
        Aetherion is a free, non-commercial fan project made for learning. It is not affiliated with, endorsed or
        sponsored by Lucasfilm Ltd. or The Walt Disney Company; Star Wars and related names are their trademarks.
        Nothing here is sold.{" "}
        <a
          href="https://sketchfab.com/3d-models/holocron-bb1d39d2a3854fecac4760bcc219e2ac"
          className="underline underline-offset-2 hover:text-muted"
          target="_blank"
          rel="noreferrer"
        >
          “Holocron”
        </a>{" "}
        3D model by{" "}
        <a
          href="https://sketchfab.com/brq327"
          className="underline underline-offset-2 hover:text-muted"
          target="_blank"
          rel="noreferrer"
        >
          brq327
        </a>
        , licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline underline-offset-2 hover:text-muted"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>{" "}
        (materials modified).
      </p>
    </footer>
  );
}
