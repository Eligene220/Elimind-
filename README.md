# Elimind TV

A responsive video-sharing website built with HTML, CSS, JavaScript and Supabase.

## Included
- Responsive YouTube-inspired layout and category navigation
- Public video feed, search and sorting
- Supabase email/password sign-up and sign-in
- Profile display and editing
- Video upload to Supabase Storage
- Comments, likes/dislikes, subscriptions
- Playlists and watch history views
- Row Level Security policies on the platform tables

## Supabase project already connected
The app is configured for the Elimind TV Supabase project:
- Project URL: `https://jjnfakxngdgplucjjqkg.supabase.co`
- Frontend uses the project's publishable key. It is safe to include in browser code.
- Never put a Supabase `service_role` or secret key in this folder or in a public website.

## Run it
1. Extract `elimind-tv.zip`.
2. Open the extracted `elimind-tv` folder.
3. Start a local web server in that folder. Easiest: install/use VS Code with the Live Server extension, right-click `index.html`, choose **Open with Live Server**. Alternatively, run `python -m http.server 8000` and open `http://localhost:8000`.
4. Sign up with an email and password. If email confirmation is enabled, confirm the email before signing in.
5. Upload an MP4/WebM/MOV video while signed in.

Do not open `index.html` directly as a `file://` URL; browser modules and Supabase require a local/hosted web server.

## Supabase Auth URL setup
In Supabase Dashboard → Authentication → URL Configuration:
- Set Site URL to your deployed website URL once deployed.
- Add your local development URL (for example `http://localhost:8000/**`) to Redirect URLs.
Email/password sign-in is used. Email confirmation may need to be completed from the confirmation email.

## Deploy
You can deploy this static folder to Cloudflare Pages, Netlify, GitHub Pages, or another static host. Upload the contents of this folder (not the zip file itself) to the host.

## Storage and database
The Supabase database migration created these tables: `profiles`, `videos`, `comments`, `reactions`, `subscriptions`, `follows`, `playlists`, `playlist_videos`, and `watch_history`. RLS is enabled on all platform tables. A public `elimind-videos` Storage bucket is created; authenticated uploads are restricted to a folder named with the uploader's auth user ID.

## Current limitations / next production hardening
- Video files are stored in Supabase Storage; the configured per-file cap is 1 GB. For large creator libraries, use resumable uploads and a video CDN/transcoding pipeline.
- Thumbnail upload, creator channel pages, profile avatars, playlist item management UI, dislike totals, and follow controls can be added next.
- Public view counts are displayed from the database but are not incremented yet.
- This is a working first release foundation, not yet a fully hardened large-scale public video service. Add moderation/reporting, rate limits, backups, and video processing before major public traffic.
