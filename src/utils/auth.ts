export const checkUserExists = (user: any) => {
  if (user) {
    const error: any = new Error("Phone number already exists");
    error.status = 409;
    error.code = "Error_already_exists";
    throw error;
  }
};
