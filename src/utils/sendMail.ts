import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "fleta92@ethereal.email",
        pass: "a5vd534198GXBDySUj",
    },
});

// async..await is not allowed in global scope, must use a wrapper
export async function sendMail(to: string, html: string) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Reddit Clone" <redditclone@mail.com>',
        to,
        subject: "Change your password",
        html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

