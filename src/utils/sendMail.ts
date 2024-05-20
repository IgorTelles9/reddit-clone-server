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
export async function sendMail(to: string, text: string) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>',
        to,
        subject: "Change your password",
        text,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

