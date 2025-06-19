export default function Nutzungsbedingungen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Nutzungsbedingungen
        </h1>

        <div className="glass rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              1. Geltungsbereich
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Diese Nutzungsbedingungen gelten für die Nutzung der
              Chat-Anwendung auf dieser Subdomain von lukeschroeter.de. Die
              Anwendung ermöglicht es Nutzern, mit verschiedenen KI-Modellen zu
              interagieren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              2. Beschreibung des Dienstes
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Anwendung bietet folgende Funktionen:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Chat-Interface für Interaktionen mit KI-Modellen</li>
              <li>Speicherung von Unterhaltungsverläufen</li>
              <li>Consensus-Chat mit mehreren Modellen gleichzeitig</li>
              <li>Datei-Upload für Anhänge in Gesprächen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              3. Bring-Your-Own-Key Modell
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Nutzung der Anwendung erfolgt nach dem "Bring-Your-Own-Key"
              Prinzip:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                Nutzer müssen ihren eigenen OpenRouter API-Schlüssel
                bereitstellen
              </li>
              <li>
                Alle Kosten für KI-Modell-Anfragen trägt der Nutzer direkt über
                seinen API-Schlüssel
              </li>
              <li>Die Anwendung selbst ist kostenfrei nutzbar</li>
              <li>
                Der Betreiber übernimmt keine Haftung für Kosten, die durch die
                API-Nutzung entstehen
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              4. Registrierung und Nutzerkonto
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Für die Nutzung ist eine Registrierung erforderlich:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Die Registrierung erfolgt über Supabase Auth</li>
              <li>Nutzer müssen wahrheitsgemäße Angaben machen</li>
              <li>Jeder Nutzer darf nur ein Konto erstellen</li>
              <li>Die Weitergabe von Zugangsdaten ist untersagt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              5. Zulässige Nutzung
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Bei der Nutzung der Anwendung ist Folgendes untersagt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Verwendung für illegale Zwecke</li>
              <li>
                Verbreitung von hasserfüllten, diskriminierenden oder
                beleidigenden Inhalten
              </li>
              <li>
                Versuch, die Anwendung zu manipulieren oder zu beschädigen
              </li>
              <li>Übermäßige Nutzung, die die Systemleistung beeinträchtigt</li>
              <li>
                Verletzung von Urheberrechten oder anderen Rechten Dritter
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              6. Datenschutz und Speicherung
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Bezüglich der Datenverarbeitung gilt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                Chat-Verläufe werden in der Supabase-Datenbank gespeichert
              </li>
              <li>API-Schlüssel werden verschlüsselt gespeichert</li>
              <li>Nutzer können ihre Daten jederzeit löschen</li>
              <li>
                Detaillierte Informationen finden Sie in der
                Datenschutzerklärung
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              7. Verfügbarkeit
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Der Betreiber bemüht sich um eine hohe Verfügbarkeit der
              Anwendung, kann jedoch keine 100%ige Verfügbarkeit garantieren.
              Wartungsarbeiten werden nach Möglichkeit angekündigt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              8. Haftungsausschluss
            </h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Der Betreiber haftet nicht für:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Inhalte, die von KI-Modellen generiert werden</li>
              <li>
                Kosten, die durch die Nutzung von API-Schlüsseln entstehen
              </li>
              <li>Datenverlust aufgrund technischer Probleme</li>
              <li>Schäden durch unsachgemäße Nutzung der Anwendung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              9. Kündigung
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Nutzer können ihr Konto jederzeit ohne Angabe von Gründen löschen.
              Der Betreiber behält sich vor, Konten bei Verstößen gegen diese
              Nutzungsbedingungen zu sperren oder zu löschen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              10. Änderungen
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Diese Nutzungsbedingungen können jederzeit geändert werden. Nutzer
              werden über wesentliche Änderungen informiert. Die Fortsetzung der
              Nutzung nach einer Änderung gilt als Zustimmung zu den neuen
              Bedingungen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">
              11. Schlussbestimmungen
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Es gilt deutsches Recht. Sollten einzelne Bestimmungen unwirksam
              sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400">Stand: Juni 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
