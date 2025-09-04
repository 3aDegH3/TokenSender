// src/components/__tests__/AirdropForm.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AirdropForm from "@/components/AirdropForm";

const VALID_ADDR = "0x" + "1".repeat(40);

describe("AirdropForm - essential tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders form fields and submit button", () => {
    render(<AirdropForm />);
    expect(screen.getByPlaceholderText(/0x\.\.\./i)).toBeInTheDocument(); // token
    expect(screen.getByPlaceholderText(/0xabc.*or newline separated/i)).toBeInTheDocument(); // recipients
    expect(screen.getByPlaceholderText(/1000, 2000, 3000/i)).toBeInTheDocument(); // amounts
    expect(screen.getByRole("button", { name: /send tokens/i })).toBeInTheDocument();
  });

  test("shows error when token address is invalid", async () => {
    render(<AirdropForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/0x\.\.\./i), "invalid-address");
    await user.type(
      screen.getByPlaceholderText(/0xabc.*or newline separated/i),
      `${VALID_ADDR}, ${VALID_ADDR}`
    );
    await user.type(screen.getByPlaceholderText(/1000, 2000, 3000/i), `100,200`);

    await user.click(screen.getByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Invalid token address/i)).toBeInTheDocument();
  });

  test("shows error when recipients and amounts counts mismatch", async () => {
    render(<AirdropForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/0x\.\.\./i), VALID_ADDR);
    await user.type(
      screen.getByPlaceholderText(/0xabc.*or newline separated/i),
      `${VALID_ADDR}, ${VALID_ADDR}`
    );
    await user.type(screen.getByPlaceholderText(/1000, 2000, 3000/i), `100`);

    await user.click(screen.getByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Recipients and amounts must have same count/i)).toBeInTheDocument();
  });

  test("shows error when amounts are non-numeric or zero", async () => {
    render(<AirdropForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/0x\.\.\./i), VALID_ADDR);
    await user.type(
      screen.getByPlaceholderText(/0xabc.*or newline separated/i),
      `${VALID_ADDR}`
    );
    await user.type(screen.getByPlaceholderText(/1000, 2000, 3000/i), `abc`);

    await user.click(screen.getByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Amounts must be numeric/i)).toBeInTheDocument();
  });

  test("calculates total and shows counts correctly", async () => {
    render(<AirdropForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/0x\.\.\./i), VALID_ADDR);
    await user.type(
      screen.getByPlaceholderText(/0xabc.*or newline separated/i),
      `${VALID_ADDR}, ${VALID_ADDR}, ${VALID_ADDR}`
    );
    await user.type(screen.getByPlaceholderText(/1000, 2000, 3000/i), `100,200,300`);

    // به‌جای جستجوی یک رشته‌ی ترکیبی، label را پیدا می‌کنیم و سپس مقدار sibling را می‌خوانیم
    const recipientsLabel = await screen.findByText("Recipients");
    expect(recipientsLabel).toBeInTheDocument();
    const recipientsCount = recipientsLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(recipientsCount).toHaveTextContent("3");

    const amountsLabel = screen.getByText("Amounts");
    const amountsCount = amountsLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(amountsCount).toHaveTextContent("3");

    const totalLabel = screen.getByText(/Total \(wei\)/i);
    const totalValue = totalLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(totalValue).toHaveTextContent("600");
  });
});