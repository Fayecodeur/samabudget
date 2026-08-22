import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

let resend: Resend;

const getResendClient = (): Resend => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const genericMessage = {
      message: "Si ce compte existe, un email de réinitialisation a été envoyé",
    };

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(genericMessage);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await getResendClient().emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Réinitialisation de votre mot de passe - Sama Budget",
      html: `
        <p>Bonjour ${user.name},</p>
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <p><a href="${resetUrl}">Cliquez ici pour réinitialiser votre mot de passe</a></p>
        <p>Ce lien est valable 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    });

    res.status(200).json(genericMessage);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token et nouveau mot de passe requis" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Lien invalide ou expiré" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined as unknown as string;
    user.resetPasswordExpires = undefined as unknown as Date;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
