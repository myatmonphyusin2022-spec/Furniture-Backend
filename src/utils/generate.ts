import { randomBytes, randomInt } from "crypto";

export const generateOTP = (): number => {
  return randomInt(100000, 1000000);
};

export const generateToken =() =>{
  return randomBytes(32).toString("hex");
}