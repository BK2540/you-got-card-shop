import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
};

const getFromEmail = () =>
  process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

export const sendEmail = async (input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false as const,
      error: "Missing RESEND_API_KEY",
    };
  }

  const to = input.to.trim().toLowerCase();
  if (!to) {
    return {
      ok: false as const,
      error: "Missing recipient email",
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return {
        ok: false as const,
        error:
          "message" in error && typeof error.message === "string"
            ? error.message
            : JSON.stringify(error),
      };
    }

    return {
      ok: true as const,
      id: data?.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email";

    return {
      ok: false as const,
      error: message,
    };
  }
};
