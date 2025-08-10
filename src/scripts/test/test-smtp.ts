import { 
  verifySmtpConnection, 
  sendEmail, 
  emailTemplates 
} from '../../config/smtp-email';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script de test pour la configuration SMTP Gmail
 */
async function testSmtpConnection() {
  console.log('🧪 Test de la configuration SMTP Gmail...\n');

  try {
    // 1. Vérifier les variables d'environnement
    console.log('1️⃣ Vérification des variables d\'environnement...');
    
    if (!process.env.GMAIL_USER) {
      throw new Error('❌ Variable GMAIL_USER manquante dans .env');
    }
    
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error('❌ Variable GMAIL_APP_PASSWORD manquante dans .env');
    }
    
    console.log(`✅ GMAIL_USER: ${process.env.GMAIL_USER}`);
    console.log(`✅ GMAIL_APP_PASSWORD: ${'*'.repeat(process.env.GMAIL_APP_PASSWORD.length)}`);
    console.log(`✅ APP_NAME: ${process.env.APP_NAME || 'Synkrone (par défaut)'}`);
    console.log();

    // 2. Tester la connexion SMTP
    console.log('2️⃣ Test de connexion SMTP...');
    const connectionOk = await verifySmtpConnection();
    
    if (!connectionOk) {
      throw new Error('❌ Échec de la connexion SMTP');
    }
    console.log();

    // 3. Demander l'email de destination pour le test
    const testEmail = process.env.GMAIL_USER; // Utiliser l'email Gmail configuré
    console.log(`3️⃣ Envoi d'un email de test à: ${testEmail}`);

    // 4. Test d'email simple
    console.log('📧 Test 1: Email simple...');
    await sendEmail({
      to: testEmail,
      subject: '🧪 Test SMTP - Email Simple',
      text: 'Ceci est un test d\'email simple depuis votre configuration SMTP Gmail.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">✅ Test SMTP réussi !</h2>
          <p>Ceci est un email de test depuis votre configuration SMTP Gmail.</p>
          <p><strong>Configuration testée :</strong></p>
          <ul>
            <li>Host: smtp.gmail.com</li>
            <li>Port: 587 (TLS)</li>
            <li>Utilisateur: ${process.env.GMAIL_USER}</li>
          </ul>
          <p>Si vous recevez cet email, votre configuration fonctionne parfaitement ! 🎉</p>
        </div>
      `
    });
    console.log('✅ Email simple envoyé avec succès\n');

    // 5. Test des templates
    console.log('📧 Test 2: Template de vérification d\'email...');
    const verificationTemplate = emailTemplates.emailVerification('123456', 'John');
    await sendEmail({
      to: testEmail,
      ...verificationTemplate
    });
    console.log('✅ Template de vérification envoyé avec succès\n');

    console.log('📧 Test 3: Template de réinitialisation de mot de passe...');
    const resetTemplate = emailTemplates.passwordReset('789012', 'John');
    await sendEmail({
      to: testEmail,
      ...resetTemplate
    });
    console.log('✅ Template de réinitialisation envoyé avec succès\n');

    console.log('📧 Test 4: Template de bienvenue...');
    const welcomeTemplate = emailTemplates.welcome('John', 'freelance');
    await sendEmail({
      to: testEmail,
      ...welcomeTemplate
    });
    console.log('✅ Template de bienvenue envoyé avec succès\n');

    // 6. Résumé des tests
    console.log('🎉 TOUS LES TESTS SMTP ONT RÉUSSI !');
    console.log('📋 Résumé :');
    console.log('   ✅ Variables d\'environnement configurées');
    console.log('   ✅ Connexion SMTP établie');
    console.log('   ✅ Email simple envoyé');
    console.log('   ✅ Template de vérification d\'email testé');
    console.log('   ✅ Template de réinitialisation testé');
    console.log('   ✅ Template de bienvenue testé');
    console.log();
    console.log('📬 Vérifiez votre boîte de réception Gmail pour voir les emails de test.');

  } catch (error) {
    console.error('💥 ERREUR LORS DU TEST SMTP:', error);
    console.log('\n🔧 CONSEILS DE DÉPANNAGE :');
    console.log('1. Vérifiez vos variables d\'environnement dans le fichier .env');
    console.log('2. Assurez-vous d\'utiliser un "Mot de passe d\'application" Gmail, pas votre mot de passe normal');
    console.log('3. Activez l\'authentification à 2 facteurs sur votre compte Gmail');
    console.log('4. Générez un mot de passe d\'application depuis : https://myaccount.google.com/apppasswords');
    console.log('5. Vérifiez que votre compte Gmail autorise les applications moins sécurisées (si nécessaire)');
    
    process.exit(1);
  }
}

/**
 * Test rapide de connexion seulement
 */
async function testConnectionOnly() {
  console.log('🔍 Test rapide de connexion SMTP...\n');
  
  try {
    const connectionOk = await verifySmtpConnection();
    
    if (connectionOk) {
      console.log('🎉 Connexion SMTP OK ! Vous pouvez maintenant envoyer des emails.');
    } else {
      console.log('❌ Problème de connexion SMTP. Vérifiez votre configuration.');
    }
  } catch (error) {
    console.error('💥 Erreur de connexion:', error);
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'connection':
    case 'conn':
      await testConnectionOnly();
      break;
    
    case 'full':
    case 'test':
    default:
      await testSmtpConnection();
      break;
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { testSmtpConnection, testConnectionOnly };
