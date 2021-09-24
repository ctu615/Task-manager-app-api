const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {

  sgMail.send({
    to: email,
    from: 'ctuwazurike@gmail.com',
    subject: 'Thanks for joining in!',
    text:`Welcome to the Task Manager app, ${name}. Let me know how you get along with the app.`
  })
}

const sendCancellationEmail = (email, name) => {

  sgMail.send({
    to: email,
    from: 'ctuwazurike@gmail.com',
    subject: 'We are sad to see you go!',
    text: `Hi ${name}, thank you for using the Task Manager app. We are sad that you have decided to deactivate your account, is there anything we could do better to keep you active? Please let us know how we can improve.`
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
};