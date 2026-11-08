# Depta – debt collector for shops

Separate app with its own accounts and database. CTone link is optional (Settings -> Connect to CTone).

Run: `pip install -r requirements.txt` then `python app.py` (http://localhost:5001)
Deploy: Render (render.yaml). Set DATABASE_URL (Depta's own Postgres/Supabase). Optional: DEPTA_URL (own address), CTONE_URL (pre-fills the CTone address).

Languages (🌐 button, also on login/register):
- Built in, work offline: English, Kinyarwanda, Kiswahili, Français, العربية (RTL), Español, Português – including reminder messages sent to customers.
- 100+ more via auto-translate (Amharic, Hindi, Chinese, Luganda-region languages such as Somali, Zulu, Hausa, Yoruba, ...; needs internet).
- Add or fix a translation: edit the ROWS table in i18n.js.
