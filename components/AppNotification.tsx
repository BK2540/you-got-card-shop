"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import type { SyntheticEvent } from "react";

export type AppNotificationTone = "success" | "error" | "info" | "warning";

type AppNotificationProps = {
  open: boolean;
  message: string;
  tone?: AppNotificationTone;
  autoHideDuration?: number;
  onClose: () => void;
};

const alertToneSx: Record<AppNotificationTone, object> = {
  success: {
    borderColor: "rgba(232, 82, 32, 0.46)",
    background:
      "linear-gradient(135deg, rgba(14,14,14,0.96), rgba(232,82,32,0.92))",
    color: "#fff",
  },
  error: {
    borderColor: "rgba(248, 113, 113, 0.48)",
    background:
      "linear-gradient(135deg, rgba(14,14,14,0.96), rgba(127,29,29,0.92))",
    color: "#fff",
  },
  info: {
    borderColor: "rgba(245, 185, 101, 0.42)",
    background:
      "linear-gradient(135deg, rgba(14,14,14,0.96), rgba(245,185,101,0.78))",
    color: "#fff",
  },
  warning: {
    borderColor: "rgba(245, 185, 101, 0.56)",
    background:
      "linear-gradient(135deg, rgba(14,14,14,0.96), rgba(180,83,9,0.9))",
    color: "#fff",
  },
};

const AppNotification = ({
  open,
  message,
  tone = "success",
  autoHideDuration = 3600,
  onClose,
}: AppNotificationProps) => {
  const handleClose = (_event?: Event | SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={tone}
        variant="outlined"
        sx={{
          ...alertToneSx[tone],
          width: "100%",
          minWidth: { xs: "calc(100vw - 32px)", sm: 360 },
          borderRadius: "16px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
          fontWeight: 700,
          letterSpacing: 0,
          "& .MuiAlert-icon": {
            color: "#fff",
          },
          "& .MuiAlert-action": {
            color: "#fff",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppNotification;
