# Strapi exposure report (task 1.8)

**To:** CMS / production Strapi owner  
**From:** Website migration work on `migrate-flycatch-website`  
**Instance:** `https://cms.flycatchtech.com` (same host as `www.flycatchtech.com`, DigitalOcean `68.183.85.169`)  
**Status:** Delivered and acknowledged (2026-09-12)

The public Strapi REST API on this instance currently exposes data that should not be reachable without authentication. These findings are independent of the FastAPI migration timeline and should be restricted on the live instance even if cutover slips.

## Findings

1. **Draft leakage via `publicationState=preview`**  
   Public `find` with `publicationState=preview` increases the blog listing from 82 published posts to 86, exposing four unpublished drafts.

2. **Entire media library is public**  
   `GET /api/upload/files` returns metadata for all 1,119 files, including 184 PDFs.

3. **Staff account data leaks through the blog `author` relation**  
   Populating `author` returns a `users` record, including a staff email address.

4. **User directory is public**  
   `GET /api/users` and `GET /api/users-permissions/roles` return 200 unauthenticated.

5. **Lead collections are publicly readable**  
   `downloads`, `contacts`, and `applications` are exposed as public reads. `downloads` returns personal data.

6. **Admin panel is publicly reachable**  
   `https://cms.flycatchtech.com/admin` is on the public internet.

## Requested action

- Restrict public `find` / `findOne` on unpublished content, users, media listing, and lead collections.
- Confirm receipt of this report so task 1.8 can be marked complete.

**Acknowledgment:** received 2026-09-12
