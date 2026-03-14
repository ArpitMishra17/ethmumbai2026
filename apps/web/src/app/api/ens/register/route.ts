import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkSubnameAvailable, getParentNamehash, getLabelHash, ensRegistryAbi } from "@/lib/ens";
import { ENS_REGISTRY_ADDRESS, ENS_PUBLIC_RESOLVER_ADDRESS, ENS_PARENT_NAME } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { label } = await req.json();
  if (!label || !/^[a-z0-9-]+$/.test(label) || label.length < 3 || label.length > 32) {
    return NextResponse.json({ error: "Invalid label" }, { status: 400 });
  }

  const available = await checkSubnameAvailable(label);
  if (!available) {
    return NextResponse.json({ error: "Name already taken" }, { status: 409 });
  }

  const ownerKey = process.env.ENS_OWNER_PRIVATE_KEY;
  if (!ownerKey) {
    return NextResponse.json({ error: "ENS owner key not configured" }, { status: 500 });
  }

  try {
    const account = privateKeyToAccount(ownerKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"),
    });

    const parentNode = getParentNamehash();
    const labelHash = getLabelHash(label);

    const txHash = await walletClient.writeContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: ensRegistryAbi,
      functionName: "setSubnodeRecord",
      args: [
        parentNode,
        labelHash,
        session.address as `0x${string}`,
        ENS_PUBLIC_RESOLVER_ADDRESS,
        BigInt(0),
      ],
    });

    const fullName = `${label}.${ENS_PARENT_NAME}`;

    await prisma.ensProfile.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ensName: fullName },
      update: { ensName: fullName },
    });

    // Advance onboarding
    await prisma.onboardingSession.updateMany({
      where: { userId: session.userId, status: "ens_pending" },
      data: { status: "agent_pending" },
    });

    return NextResponse.json({ ok: true, ensName: fullName, txHash });
  } catch (error) {
    console.error("ENS register error:", error);
    return NextResponse.json({ error: "Failed to register ENS name" }, { status: 500 });
  }
}
