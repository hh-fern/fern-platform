export const isSelfHosted = (): boolean => {
  return process.env.NEXT_PUBLIC_IS_SELF_HOSTED === "1";
};
