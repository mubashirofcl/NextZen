import {
  emailValidator,
  nameValidator,
  passwordValidator,
  passwordRequiredValidator,
  otpValidator,
} from "../../../validators/common.validators.js";

export const requestSignupOTPValidator = [
  nameValidator, 
  emailValidator, 
  passwordValidator
];

export const verifyOTPValidator = [
  emailValidator, 
  otpValidator, 
  nameValidator, 
  passwordValidator
];

export const loginUserValidator = [
  emailValidator, 
  passwordRequiredValidator
];

export const requestForgotPasswordValidator = [
  emailValidator
];

export const resetPasswordValidator = [
  emailValidator, 
  otpValidator, 
  passwordValidator
];