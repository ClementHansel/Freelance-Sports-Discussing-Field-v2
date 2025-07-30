export type ModerationStatus = "pending" | "approved" | "rejected";

export function isValidModerationStatus(
    status: string | null | undefined,
): ModerationStatus | null {
    if (
        status === "pending" || status === "approved" || status === "rejected"
    ) {
        return status;
    }
    return null; // Return null for any unexpected or undefined status
}
