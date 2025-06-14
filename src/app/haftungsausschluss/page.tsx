export default function Haftungsausschluss() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Haftungsausschluss
        </h1>
        
        <div className="glass rounded-xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Allgemeine Hinweise</h2>
            <p className="text-gray-300 leading-relaxed">
              Dieser Haftungsausschluss gilt spezifisch für die Chat-Anwendung auf dieser Subdomain 
              von lukeschroeter.de und ergänzt die allgemeinen Haftungsbestimmungen der Hauptdomain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">1. Haftung für KI-generierte Inhalte</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Chat-Anwendung ermöglicht Interaktionen mit verschiedenen KI-Modellen. Hierbei gilt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Alle Antworten werden von externen KI-Modellen generiert</li>
              <li>Der Betreiber hat keinen Einfluss auf die generierten Inhalte</li>
              <li>KI-Antworten können fehlerhaft, unvollständig oder irreführend sein</li>
              <li>Nutzer sind selbst für die Bewertung und Verwendung der Inhalte verantwortlich</li>
              <li>Keine Gewähr für Richtigkeit, Vollständigkeit oder Aktualität der KI-Antworten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">2. Bring-Your-Own-Key Modell</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Da die Anwendung nach dem "Bring-Your-Own-Key" Prinzip funktioniert:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Nutzer tragen alle Kosten für API-Anfragen selbst</li>
              <li>Der Betreiber übernimmt keine Haftung für entstehende Kosten</li>
              <li>Keine Gewähr für die Verfügbarkeit externer API-Dienste</li>
              <li>Nutzer sind für die ordnungsgemäße Verwaltung ihrer API-Schlüssel verantwortlich</li>
              <li>Missbrauch von API-Schlüsseln liegt in der Verantwortung des Nutzers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">3. Technische Verfügbarkeit</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Bezüglich der technischen Bereitstellung gilt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Keine Garantie für ununterbrochene Verfügbarkeit der Anwendung</li>
              <li>Wartungsarbeiten können zu temporären Ausfällen führen</li>
              <li>Externe Abhängigkeiten (Supabase, OpenRouter, Vercel) können die Verfügbarkeit beeinträchtigen</li>
              <li>Keine Haftung für Datenverlust bei technischen Problemen</li>
              <li>Nutzer sollten wichtige Chat-Verläufe regelmäßig exportieren</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">4. Nutzergenerierte Inhalte</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Für von Nutzern eingegebene Inhalte gilt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Nutzer sind allein verantwortlich für ihre Eingaben</li>
              <li>Keine Überprüfung von Nutzerinhalten durch den Betreiber</li>
              <li>Nutzer müssen Urheberrechte und andere Rechte Dritter beachten</li>
              <li>Keine Haftung für rechtliche Konsequenzen aus Nutzereingaben</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">5. Externe Dienste und Links</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Die Anwendung nutzt externe Dienste:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>OpenRouter:</strong> Keine Kontrolle über Modellverfügbarkeit oder -qualität</li>
              <li><strong>Supabase:</strong> Abhängigkeit von externer Datenbankinfrastruktur</li>
              <li><strong>Vercel:</strong> Hosting-Abhängigkeit für die Anwendung</li>
              <li>Keine Haftung für Ausfälle oder Probleme bei externen Anbietern</li>
              <li>Datenschutzbestimmungen der externen Anbieter gelten zusätzlich</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">6. Datensicherheit</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Trotz Sicherheitsmaßnahmen gilt:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Keine absolute Garantie für Datensicherheit</li>
              <li>Nutzer sollten keine hochsensiblen Daten in Chats eingeben</li>
              <li>Regelmäßige Backups werden empfohlen</li>
              <li>Bei Sicherheitsvorfällen erfolgt schnellstmögliche Information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">7. Experimenteller Charakter</h2>
            <p className="text-gray-300 leading-relaxed">
              Diese Anwendung hat experimentellen Charakter. Funktionen können sich ändern, 
              hinzugefügt oder entfernt werden. Nutzer verwenden die Anwendung auf eigenes Risiko 
              und sollten sich bewusst sein, dass es sich um ein Entwicklungsprojekt handelt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">8. Haftungsbegrenzung</h2>
            <p className="text-gray-300 leading-relaxed">
              Die Haftung des Betreibers ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. 
              Für leichte Fahrlässigkeit wird nur bei Verletzung wesentlicher Vertragspflichten gehaftet, 
              und zwar der Höhe nach begrenzt auf den bei Vertragsschluss vorhersehbaren, 
              vertragstypischen Schaden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">9. Salvatorische Klausel</h2>
            <p className="text-gray-300 leading-relaxed">
              Sollten einzelne Bestimmungen dieses Haftungsausschlusses unwirksam oder undurchführbar 
              sein oder werden, so wird dadurch die Wirksamkeit der übrigen Bestimmungen nicht berührt.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Stand: Juni 2025<br />
              Dieser Haftungsausschluss ergänzt die allgemeinen Haftungsbestimmungen von lukeschroeter.de
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 