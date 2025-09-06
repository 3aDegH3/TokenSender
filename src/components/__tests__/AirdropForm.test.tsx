// src/components/__tests__/AirdropForm.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AirdropFormUI from "@/components/AirdropForm/AirdropForm.ui";
import { useState, useMemo } from "react";

const VALID_ADDR = "0x" + "1".repeat(40);

function parseListSimple(s: string) {
  return s
    .split(/[,|\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** A small wrapper that provides the minimal state/logic AirdropFormUI expects.
 *  We keep logic simple and synchronous so tests are deterministic.
 */
function Wrapper(props: {
  initialToken?: string;
  initialRecipients?: string;
  initialAmounts?: string;
  decimals?: number;
  onSubmit?: (payload: any) => Promise<void>;
}) {
  const { initialToken = "", initialRecipients = "", initialAmounts = "", decimals = 18, onSubmit } = props;
  const [tokenAddress, setTokenAddress] = useState(initialToken);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [amounts, setAmounts] = useState(initialAmounts);
  const [localIsUnsafeMode, setLocalIsUnsafeMode] = useState(false);

  const recipientsList = useMemo(() => parseListSimple(recipients), [recipients]);
  const amountsList = useMemo(() => parseListSimple(amounts), [amounts]);

  const totalBig = useMemo(() => {
    try {
      if (amountsList.length === 0) return BigInt(0);
      const arr = amountsList.map((a) => {
        const n = Number(a);
        if (Number.isNaN(n)) throw new Error("Amounts must be numeric");
        return BigInt(Math.floor(n));
      });
      return arr.reduce((s, n) => s + n, BigInt(0));
    } catch {
      return BigInt(-1);
    }
  }, [amountsList]);

  const countsMatch = recipientsList.length > 0 && recipientsList.length === amountsList.length;
  const hasEnoughTokens = true;

  const submitFn = onSubmit ?? (async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      throw new Error("Invalid token address");
    }
    if (!countsMatch) {
      throw new Error("Recipients and amounts must have same count");
    }
    if (amountsList.some((x) => x.trim() === "" || Number.isNaN(Number(x)))) {
      throw new Error("Amounts must be numeric");
    }
    if (totalBig === BigInt(-1) || totalBig <= BigInt(0)) {
      throw new Error("Total invalid");
    }
    return;
  });

  return (
    <AirdropFormUI
      tokenAddress={tokenAddress}
      setTokenAddress={setTokenAddress}
      recipients={recipients}
      setRecipients={setRecipients}
      amounts={amounts}
      setAmounts={setAmounts}
      localIsUnsafeMode={localIsUnsafeMode}
      setLocalIsUnsafeMode={setLocalIsUnsafeMode}
      recipientsList={recipientsList}
      amountsList={amountsList}
      totalBig={totalBig}
      countsMatch={countsMatch}
      decimals={decimals}
      name={"TKN"}
      balanceRaw={BigInt(1000000)}
      hasEnoughTokens={hasEnoughTokens}
      onSubmit={submitFn}
      isPending={false}
      isConfirming={false}
      isConfirmed={false}
      writeError={null}
      isConnected={true}
    />
  );
}

describe("AirdropFormUI - essential tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders form fields and submit button", async () => {
    render(<Wrapper />);
    // wait for inputs to appear (AirdropForm.ui sets isClient in useEffect)
    const tokenInput = await screen.findByPlaceholderText(/0x\.\.\./i);
    const recipientsInput = await screen.findByPlaceholderText(/0xabc.*or newline separated/i);
    const amountsInput = await screen.findByPlaceholderText(/1.5, 2.0, 0.1/i);
    expect(tokenInput).toBeInTheDocument();
    expect(recipientsInput).toBeInTheDocument();
    expect(amountsInput).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /send tokens/i })).toBeInTheDocument();
  });

  test("shows error when token address is invalid", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const tokenInput = await screen.findByPlaceholderText(/0x\.\.\./i);
    const recipientsInput = await screen.findByPlaceholderText(/0xabc.*or newline separated/i);
    const amountsInput = await screen.findByPlaceholderText(/1.5, 2.0, 0.1/i);

    await user.type(tokenInput, "invalid-address");
    await user.type(recipientsInput, `${VALID_ADDR}, ${VALID_ADDR}`);
    await user.type(amountsInput, `100,200`);

    await user.click(await screen.findByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Invalid token address/i)).toBeInTheDocument();
  });

  test("shows error when recipients and amounts counts mismatch", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const tokenInput = await screen.findByPlaceholderText(/0x\.\.\./i);
    const recipientsInput = await screen.findByPlaceholderText(/0xabc.*or newline separated/i);
    const amountsInput = await screen.findByPlaceholderText(/1.5, 2.0, 0.1/i);

    await user.type(tokenInput, VALID_ADDR);
    await user.type(recipientsInput, `${VALID_ADDR}, ${VALID_ADDR}`);
    await user.type(amountsInput, `100`);

    await user.click(await screen.findByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Recipients and amounts must have same count/i)).toBeInTheDocument();
  });

  test("shows error when amounts are non-numeric or zero", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const tokenInput = await screen.findByPlaceholderText(/0x\.\.\./i);
    const recipientsInput = await screen.findByPlaceholderText(/0xabc.*or newline separated/i);
    const amountsInput = await screen.findByPlaceholderText(/1.5, 2.0, 0.1/i);

    await user.type(tokenInput, VALID_ADDR);
    await user.type(recipientsInput, `${VALID_ADDR}`);
    await user.type(amountsInput, `abc`);

    await user.click(await screen.findByRole("button", { name: /send tokens/i }));

    expect(await screen.findByText(/Amounts must be numeric/i)).toBeInTheDocument();
  });

  test("calculates total and shows counts correctly", async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    const tokenInput = await screen.findByPlaceholderText(/0x\.\.\./i);
    const recipientsInput = await screen.findByPlaceholderText(/0xabc.*or newline separated/i);
    const amountsInput = await screen.findByPlaceholderText(/1.5, 2.0, 0.1/i);

    await user.type(tokenInput, VALID_ADDR);
    await user.type(recipientsInput, `${VALID_ADDR}, ${VALID_ADDR}, ${VALID_ADDR}`);
    await user.type(amountsInput, `100,200,300`);

    // CountsGrid renders "Recipients", "Amounts", "Total (wei)"
    const recipientsLabel = await screen.findByText("Recipients");
    expect(recipientsLabel).toBeInTheDocument();
    const recipientsCount = recipientsLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(recipientsCount).toHaveTextContent("3");

    const amountsLabel = await screen.findByText("Amounts");
    const amountsCount = amountsLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(amountsCount).toHaveTextContent("3");

    const totalLabel = screen.getByText(/Total \(wei\)/i);
    const totalValue = totalLabel.parentElement?.querySelector("div:nth-child(2)");
    expect(totalValue).toHaveTextContent("600");
  });
});
