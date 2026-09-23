export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  role: "LEARNER" | "ADMIN";
  dailyGoal: number;
  timeZone: string;
};

export type FormState = {
  message: string;
  status?: "error" | "success";
  recoveryEmail?: string;
  errors?: Partial<Record<"displayName" | "email" | "token" | "password" | "confirmPassword" | "dailyGoal" | "timeZone", string[]>>;
};
