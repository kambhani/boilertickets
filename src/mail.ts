import nodemailer from "nodemailer";
import invariant from "tiny-invariant";

invariant(process.env.SMTP_HOST, "SMTP host must be defined!");
invariant(
	process.env.SMTP_PORT && Number.parseInt(process.env.SMTP_PORT),
	"SMTP port must be defined!",
);
invariant(process.env.SMTP_USER, "SMTP user must be defined!");
invariant(process.env.SMTP_PASS, "SMTP pass must be defined!");

export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number.parseInt(process.env.SMTP_PORT),
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});
