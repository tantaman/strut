export function validateLoginFields(fields: Express.Request["fields"]): {
  email: string;
  pass: string;
} | null {
  const email = fields?.email;
  const pass = fields?.pass;

  if (!email || !pass) {
    return null;
  }

  if (typeof email !== "string" || typeof pass !== "string") {
    return null;
  }

  if (email.length > 500 || pass.length > 500) {
    return null;
  }

  return {
    email,
    pass,
  };
}
