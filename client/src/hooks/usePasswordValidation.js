import { useMemo } from "react";
import { passwordChecks } from "../constants/passwordPolicy";

export function usePasswordValidation(password) {
  const checks = useMemo(() => {
    return passwordChecks.map((rule) => ({
      ...rule,
      valid: rule.test(password),
    }));
  }, [password]);

  const isValid = useMemo(() => checks.every((c) => c.valid), [checks]);

  return { checks, isValid };
}
