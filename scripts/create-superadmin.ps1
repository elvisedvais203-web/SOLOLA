# Le compte super-admin est créé au démarrage de l’API si SUPERADMIN_* est défini (voir nextalkbootstrap.service).
# La connexion se fait uniquement via Firebase : utilise le même e-mail que SUPERADMIN_EMAIL avec Google,
# ou le numéro SUPERADMIN_PHONE avec l’auth SMS, pour lier firebaseUid au compte existant.

Write-Host "Solola : plus d’inscription HTTP /auth/email/register." -ForegroundColor Cyan
Write-Host "1. Définis SUPERADMIN_EMAIL, SUPERADMIN_PHONE, SUPERADMIN_PASSWORD, SUPERADMIN_NAME sur le service API." -ForegroundColor Gray
Write-Host "2. Déploie l’API : le bootstrap crée ou met à jour l’utilisateur SUPERADMIN." -ForegroundColor Gray
Write-Host "3. Connecte-toi sur /auth avec Firebase (Google recommandé avec le même e-mail)." -ForegroundColor Gray
