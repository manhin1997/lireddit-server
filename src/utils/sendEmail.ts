import nodemailer from "nodemailer";

export async function sendEmail(to : string, from : string = '"Fred Foo 👻" <foo@example.com>' , html: string) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.NODEMAIL_USER, // generated ethereal user
        pass: process.env.NODEMAIL_PASSWORD, // generated ethereal password
    },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
    from, // sender address
    to, // list of receivers
    subject: "Change Password", // Subject line
    html, // plain text body
    });

    console.log("Message sent: %s", info.messageId);

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}