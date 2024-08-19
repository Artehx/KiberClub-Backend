const sendgrid = require('@sendgrid/mail');

module.exports = {

sendGridEmail: async function(email, id) {
    try {
      sendgrid.setApiKey(process.env.SENDGRID_APIKEY);

      const msg = {
        from: 'arturocorral2002@gmail.com',
        to: email,
        subject: 'Registro en KiberClub.es',
        html: `<h3>Se ha registrado correctamente en KiberClub.es</h3>
        <p>Pulsa <a href='http://localhost:5000/api/Cliente/ActivarCuenta/${id}'>AQUÍ</a> para activar tu cuenta.</p>`
      };

      const result = await sendgrid.send(msg);
      console.log("Resultado del envío-> ", result);
    } catch (error) {
      console.error("Error al enviar el correo:", error);
    }
  }
}