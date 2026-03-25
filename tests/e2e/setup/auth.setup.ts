import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local to run E2E tests."
    );
  }

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  // Wait until we are redirected away from login (i.e. auth succeeded)
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/"), {
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
