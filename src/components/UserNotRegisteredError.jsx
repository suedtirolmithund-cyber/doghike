const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/20 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-400/30 bg-gradient-to-br from-brand-700 via-brand-600 to-[#2777b8] p-8 text-white shadow-[0_18px_42px_rgba(192,48,96,0.2)]">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/16">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Zugriff eingeschränkt</h1>
          <p className="mb-8 text-brand-50">
            Dein Konto ist aktuell nicht für diese App freigeschaltet. Bitte wende dich an den Administrator, wenn du Zugriff benötigst.
          </p>
          <div className="rounded-xl bg-white/12 p-4 text-left text-sm text-brand-50">
            <p>Wenn das ein Fehler sein sollte, kannst du Folgendes prüfen:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Prüfe, ob du mit dem richtigen Konto angemeldet bist</li>
              <li>Bitte den Administrator um Freischaltung</li>
              <li>Melde dich ab und erneut an</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
