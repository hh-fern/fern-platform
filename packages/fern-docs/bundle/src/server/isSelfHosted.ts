export const isSelfHosted = () => {
  return process.env.SELF_HOSTED === "1";
};
