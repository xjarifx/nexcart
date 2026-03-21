import z from "zod";

export const createUserValidation = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
});
