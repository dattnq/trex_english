export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  role: "LEARNER" | "ADMIN";
};

export type FormState = {
  message: string;
  status?: "error" | "success";
  errors?: Partial<Record<"displayName" | "email" | "password" | "confirmPassword", string[]>>;
};
