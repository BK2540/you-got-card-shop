"use client";

import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import {
  createCard,
  deleteCard,
  getAdminCards,
  updateCard,
} from "@/lib/api/cards";
import {
  Card,
  CardImage,
  CardStatus,
  InventoryCardSortDirection,
  InventoryCardSortField,
  PaginatedCardsResponse,
} from "@/types";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type UploadPreview = {
  id?: string;
  fileName: string;
  url: string;
  file?: File;
  isExisting: boolean;
};

type InventoryFormState = {
  name: string;
  playerName: string;
  team: string;
  traderName: string;
  printRun: string;
  quantity: string;
  status: CardStatus;
  price: string;
  grade: string;
  year: string;
  isRecommended: boolean;
  description: string;
};

type InventoryPageProps = {
  maxImageCount?: number;
  onChanged?: () => void | Promise<unknown>;
};

const cardStatuses: CardStatus[] = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"];

const defaultFormState: InventoryFormState = {
  name: "",
  playerName: "",
  team: "",
  traderName: "",
  printRun: "",
  price: "",
  grade: "",
  description: "",
  year: "2024",
  quantity: "0",
  status: "ACTIVE",
  isRecommended: false,
};

const defaultQueryState = {
  page: 1,
  pageSize: 6,
  search: "",
  status: "ALL" as CardStatus | "ALL",
  recommendation: "ALL" as "ALL" | "RECOMMENDED" | "NOT_RECOMMENDED",
  sortBy: "createdAt" as InventoryCardSortField,
  sortDirection: "desc" as InventoryCardSortDirection,
};

const defaultMetaState: Omit<PaginatedCardsResponse, "items"> = {
  page: 1,
  pageSize: 6,
  totalCount: 0,
  totalPages: 1,
  sortBy: "createdAt",
  sortDirection: "desc",
  search: "",
  status: "ALL",
  recommendation: "ALL",
};

const dialogSx = {
  "& .MuiDialog-paper": {
    backgroundColor: "#1a1a1a",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
  },
};

const InventoryPage = ({
  maxImageCount = 10,
  onChanged,
}: InventoryPageProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [form, setForm] = useState<InventoryFormState>(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<UploadPreview[]>([]);
  const [openAddCardDialog, setOpenAddCardDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [inventoryQuery, setInventoryQuery] = useState(defaultQueryState);
  const [inventoryMeta, setInventoryMeta] = useState(defaultMetaState);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewsRef = useRef<UploadPreview[]>([]);

  const fetchInventoryCards = useCallback(
    async (query = inventoryQuery) => {
      setInventoryLoading(true);

      try {
        const response = await getAdminCards(query);
        setCards(response.items);
        setInventoryMeta({
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages,
          sortBy: response.sortBy,
          sortDirection: response.sortDirection,
          search: response.search,
          status: response.status,
          recommendation: response.recommendation,
        });
        return response;
      } finally {
        setInventoryLoading(false);
      }
    },
    [inventoryQuery],
  );

  useEffect(() => {
    fetchInventoryCards(inventoryQuery);
  }, [fetchInventoryCards, inventoryQuery]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((preview) => {
        if (!preview.isExisting) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const resetForm = () => {
    imagePreviewsRef.current.forEach((preview) => {
      if (!preview.isExisting) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setForm(defaultFormState);
    setImagePreviews([]);
    setEditingCard(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const createImagePreview = (file: File): UploadPreview => ({
    fileName: file.name,
    url: URL.createObjectURL(file),
    file,
    isExisting: false,
  });

  const buildOrderedImagePreviews = (images: CardImage[]): UploadPreview[] => {
    const heroImage = images.find((image) => image.isHero);
    const remainingImages = images.filter((image) => !image.isHero);
    const orderedImages = heroImage ? [heroImage, ...remainingImages] : images;

    return orderedImages.map((image) => ({
      id: image.id,
      fileName: image.url.split("/").pop() ?? image.url,
      url: image.url,
      isExisting: true,
    }));
  };

  const moveHeroImageToFront = (indexToPromote: number) => {
    setImagePreviews((current) => {
      if (indexToPromote <= 0 || indexToPromote >= current.length) {
        return current;
      }

      const next = [...current];
      const [heroImage] = next.splice(indexToPromote, 1);
      next.unshift(heroImage);
      return next;
    });
  };

  const buildImageFormData = () => {
    const imageOrder = imagePreviews.map((preview) =>
      preview.isExisting
        ? { type: "existing" as const, url: preview.url }
        : { type: "new" as const },
    );

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("playerName", form.playerName);
    formData.append("team", form.team);
    formData.append("traderName", form.traderName);
    formData.append("printRun", form.printRun);
    formData.append("price", String(Number(form.price || 0)));
    formData.append("grade", form.grade);
    formData.append("year", String(Number(form.year || 0)));
    formData.append("quantity", String(Number(form.quantity || 0)));
    formData.append("isRecommended", String(form.isRecommended));
    formData.append("description", form.description);
    formData.append("status", form.status);
    formData.append("heroIndex", "0");
    formData.append("imageOrder", JSON.stringify(imageOrder));

    imagePreviews.forEach((preview) => {
      if (preview.file) {
        formData.append("images", preview.file);
      }
    });

    return formData;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createCard(buildImageFormData());
      resetForm();
      await fetchInventoryCards(inventoryQuery);
      await onChanged?.();
      setOpenAddCardDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingCard) return;

    setLoading(true);

    try {
      await updateCard(editingCard.id, buildImageFormData());
      await fetchInventoryCards(inventoryQuery);
      await onChanged?.();
      setOpenEditDialog(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCard(id);
    await fetchInventoryCards(inventoryQuery);
    await onChanged?.();
  };

  const handleCloseDialog = () => {
    setOpenAddCardDialog(false);
    if (!editingCard) {
      resetForm();
    }
  };

  const handleNumberInputChange =
    (field: "price" | "year" | "quantity") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value.replace(/[^\d]/g, "");

      setForm((current) => ({
        ...current,
        [field]: nextValue,
        ...(field === "quantity" && Number(nextValue || 0) === 0
          ? { status: "OUT_OF_STOCK" as CardStatus }
          : {}),
      }));
    };

  const handleImageFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(e.target.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    setImagePreviews((current) => [
      ...current,
      ...nextFiles
        .slice(0, Math.max(0, maxImageCount - current.length))
        .map(createImagePreview),
    ]);

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews((current) => {
      const imageToRemove = current[indexToRemove];

      if (imageToRemove && !imageToRemove.isExisting) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return current.filter((_, index) => index !== indexToRemove);
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleInventorySearchChange = (search: string) => {
    setInventoryQuery((current) => ({
      ...current,
      search,
      page: 1,
    }));
  };

  const handleInventoryStatusChange = (status: CardStatus | "ALL") => {
    setInventoryQuery((current) => ({
      ...current,
      status,
      page: 1,
    }));
  };

  const handleInventoryRecommendationChange = (
    recommendation: "ALL" | "RECOMMENDED" | "NOT_RECOMMENDED",
  ) => {
    setInventoryQuery((current) => ({
      ...current,
      recommendation,
      page: 1,
    }));
  };

  const handleInventorySortChange = (sortBy: InventoryCardSortField) => {
    setInventoryQuery((current) => {
      const sortDirection =
        current.sortBy === sortBy && current.sortDirection === "asc"
          ? "desc"
          : "asc";

      return {
        ...current,
        sortBy,
        sortDirection,
        page: 1,
      };
    });
  };

  const handleInventoryPageChange = (page: number) => {
    const safePage = Math.max(1, Math.min(page, inventoryMeta.totalPages));
    setInventoryQuery((current) => ({
      ...current,
      page: safePage,
    }));
  };

  const isFormIncomplete =
    form.name.trim() === "" ||
    form.playerName.trim() === "" ||
    form.team.trim() === "" ||
    form.price.trim() === "" ||
    form.grade.trim() === "" ||
    form.year.trim() === "" ||
    form.quantity.trim() === "" ||
    form.status.trim() === "" ||
    imagePreviews.length === 0;

  const statusToneClass = (status: CardStatus) => {
    if (status === "ACTIVE") return "bg-emerald-500/15 text-emerald-300";
    if (status === "INACTIVE") return "bg-slate-500/15 text-slate-300";
    return "bg-amber-500/15 text-amber-300";
  };

  const sortLabel = (field: InventoryCardSortField) => {
    if (inventoryQuery.sortBy !== field) {
      return "";
    }

    return inventoryQuery.sortDirection === "asc" ? " (Asc)" : " (Desc)";
  };

  const paginationPages = Array.from(
    { length: inventoryMeta.totalPages },
    (_, index) => index + 1,
  ).slice(
    Math.max(0, inventoryMeta.page - 3),
    Math.max(5, inventoryMeta.page + 2),
  );

  const renderImageUploader = () => (
    <div className="flex flex-wrap gap-3">
      {imagePreviews.map((preview, index) => (
        <div
          key={`${preview.id ?? preview.fileName}-${index}`}
          className="relative w-[176px] overflow-hidden rounded-xl border border-white/10 bg-white/5"
        >
          {index > 0 && (
            <button
              type="button"
              onClick={() => moveHeroImageToFront(index)}
              className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white transition hover:bg-black"
            >
              Set Hero
            </button>
          )}

          <button
            type="button"
            onClick={() => handleRemoveImage(index)}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
            aria-label={`Remove ${preview.fileName}`}
          >
            <CloseIcon fontSize="small" />
          </button>

          <Image
            src={preview.url}
            alt={preview.fileName}
            width={176}
            height={112}
            unoptimized
            className="h-28 w-full object-cover"
          />
          <p className="truncate px-2 py-1 text-xs text-gray-300">
            {index === 0 ? `${preview.fileName} (hero)` : preview.fileName}
          </p>
        </div>
      ))}

      {imagePreviews.length < maxImageCount && (
        <label className="flex h-[112px] w-[176px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-primary p-4 text-center transition hover:bg-white/5">
          <p>Add Card Image</p>
          <AddPhotoAlternateIcon className="h-10 w-10" />
          <p className="text-xs text-gray-400">
            {maxImageCount - imagePreviews.length} slots left
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageFilesChange}
          />
        </label>
      )}
    </div>
  );

  return (
    <main className="flex-1 space-y-10 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-orange-500">Inventory</h1>
        <CustomButton
          title="Add new card"
          onClick={() => {
            resetForm();
            setOpenAddCardDialog(true);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Dialog
          open={openAddCardDialog}
          onClose={handleCloseDialog}
          sx={dialogSx}
          fullWidth
        >
          <DialogTitle>Add New Card</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <CustomInput
                    placeholder="Name*"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />

                  <CustomInput
                    placeholder="Player Name*"
                    value={form.playerName}
                    onChange={(e) =>
                      setForm({ ...form, playerName: e.target.value })
                    }
                  />

                  <CustomInput
                    placeholder="Team*"
                    value={form.team}
                    onChange={(e) => setForm({ ...form, team: e.target.value })}
                  />
                  <CustomInput
                    placeholder="Trader Name (optional)"
                    value={form.traderName}
                    onChange={(e) =>
                      setForm({ ...form, traderName: e.target.value })
                    }
                  />
                  <CustomInput
                    placeholder="Print Run (e.g. /99)"
                    value={form.printRun}
                    onChange={(e) =>
                      setForm({ ...form, printRun: e.target.value })
                    }
                  />

                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    placeholder="Price*"
                    value={form.price}
                    onChange={handleNumberInputChange("price")}
                  />

                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    placeholder="Quantity*"
                    value={form.quantity}
                    onChange={handleNumberInputChange("quantity")}
                  />

                  <select
                    className="w-full rounded-2xl border border-primary bg-transparent p-3 text-white outline-none"
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as CardStatus,
                      })
                    }
                  >
                    {cardStatuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-surface"
                      >
                        {status}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={form.isRecommended}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isRecommended: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-orange-500"
                    />
                    Mark as Recommended
                  </label>

                  <div>
                    <p className="text-primary">
                      Card Image*{" "}
                      <span className="text-xs font-light text-gray-400">
                        Max {maxImageCount} images
                      </span>
                    </p>
                  </div>

                  {renderImageUploader()}

                  <CustomInput
                    placeholder="Grade*"
                    value={form.grade}
                    onChange={(e) =>
                      setForm({ ...form, grade: e.target.value })
                    }
                  />

                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    placeholder="Year*"
                    value={form.year}
                    onChange={handleNumberInputChange("year")}
                  />

                  <textarea
                    placeholder="Description"
                    className="min-h-32 w-full rounded-2xl border border-primary p-3 text-white outline-none focus:border-primary"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>
            </DialogContent>

            <DialogActions>
              <CustomButton
                title="Close"
                className="border border-primary bg-transparent"
                onClick={handleCloseDialog}
              />
              <CustomButton
                title={loading ? "Adding..." : "Add Card"}
                type="submit"
                disable={loading || isFormIncomplete}
              />
            </DialogActions>
          </form>
        </Dialog>

        <Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            resetForm();
          }}
          sx={dialogSx}
          fullWidth
        >
          <DialogTitle>Edit Card</DialogTitle>

          <form onSubmit={handleUpdate}>
            <DialogContent>
              <div className="space-y-4">
                <CustomInput
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <CustomInput
                  placeholder="Player Name"
                  value={form.playerName}
                  onChange={(e) =>
                    setForm({ ...form, playerName: e.target.value })
                  }
                />

                <CustomInput
                  placeholder="Team"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                />
                <CustomInput
                  placeholder="Trader Name (optional)"
                  value={form.traderName}
                  onChange={(e) =>
                    setForm({ ...form, traderName: e.target.value })
                  }
                />
                <CustomInput
                  placeholder="Print Run (e.g. /99)"
                  value={form.printRun}
                  onChange={(e) =>
                    setForm({ ...form, printRun: e.target.value })
                  }
                />

                <CustomInput
                  placeholder="Price"
                  value={form.price}
                  onChange={handleNumberInputChange("price")}
                />

                <CustomInput
                  type="text"
                  inputMode="numeric"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={handleNumberInputChange("quantity")}
                />

                <select
                  className="w-full rounded-2xl border border-primary bg-transparent p-3 text-white outline-none"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as CardStatus,
                    })
                  }
                >
                  {cardStatuses.map((status) => (
                    <option key={status} value={status} className="bg-surface">
                      {status}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.isRecommended}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isRecommended: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-orange-500"
                  />
                  Mark as Recommended
                </label>

                {renderImageUploader()}

                <CustomInput
                  placeholder="Grade"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />

                <CustomInput
                  placeholder="Year"
                  value={form.year}
                  onChange={handleNumberInputChange("year")}
                />

                <textarea
                  placeholder="Description"
                  className="min-h-32 w-full rounded-2xl border border-primary p-3 text-white outline-none focus:border-primary"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </DialogContent>

            <DialogActions>
              <CustomButton
                title="Cancel"
                onClick={() => {
                  setOpenEditDialog(false);
                  resetForm();
                }}
              />
              <CustomButton
                title={loading ? "Saving..." : "Save Changes"}
                type="submit"
                disable={loading || isFormIncomplete}
              />
            </DialogActions>
          </form>
        </Dialog>

        <div className="w-full rounded-3xl bg-surface p-6 shadow-xl lg:col-span-3">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Active Inventory</h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <CustomInput
                placeholder="Search by card/player/team/grade"
                value={inventoryQuery.search}
                onChange={(e) => handleInventorySearchChange(e.target.value)}
                className="min-w-[260px]"
              />

              <select
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                value={inventoryQuery.status}
                onChange={(e) =>
                  handleInventoryStatusChange(
                    e.target.value as CardStatus | "ALL",
                  )
                }
              >
                <option value="ALL" className="bg-surface">
                  All statuses
                </option>
                {cardStatuses.map((status) => (
                  <option key={status} value={status} className="bg-surface">
                    {status === "ACTIVE"
                      ? "active"
                      : status === "INACTIVE"
                        ? "inactive"
                        : "out of stock"}
                  </option>
                ))}
              </select>

              <select
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                value={inventoryQuery.recommendation}
                onChange={(e) =>
                  handleInventoryRecommendationChange(
                    e.target.value as "ALL" | "RECOMMENDED" | "NOT_RECOMMENDED",
                  )
                }
              >
                <option value="ALL" className="bg-surface">
                  All recommendations
                </option>
                <option value="RECOMMENDED" className="bg-surface">
                  Recommended
                </option>
                <option value="NOT_RECOMMENDED" className="bg-surface">
                  Not recommended
                </option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-gray-400">
                  <tr>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("name")}
                      >
                        Card{sortLabel("name")}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("playerName")}
                      >
                        Player{sortLabel("playerName")}
                      </button>
                    </th>
                    <th className="px-4 py-4">Team</th>
                    <th className="px-4 py-4">Grade</th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("price")}
                      >
                        Price{sortLabel("price")}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("quantity")}
                      >
                        Stock{sortLabel("quantity")}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("status")}
                      >
                        Status{sortLabel("status")}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("year")}
                      >
                        Year{sortLabel("year")}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleInventorySortChange("isRecommended")}
                      >
                        Recommended{sortLabel("isRecommended")}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {inventoryLoading && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-gray-400"
                      >
                        Loading inventory...
                      </td>
                    </tr>
                  )}

                  {!inventoryLoading &&
                    cards.map((card) => (
                      <tr
                        key={card.id}
                        className="border-t border-white/8 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                              <Image
                                src={card.image || ""}
                                alt={card.name}
                                width={48}
                                height={56}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {card.name}
                              </p>
                              <p className="max-w-[220px] truncate text-xs text-gray-500">
                                {card.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-200">
                          {card.playerName}
                        </td>
                        <td className="px-4 py-4 text-gray-200">{card.team}</td>
                        <td className="px-4 py-4 text-gray-200">
                          {card.grade}
                        </td>
                        <td className="px-4 py-4 font-medium text-white">
                          ${card.price}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">
                            {card.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusToneClass(card.status)}`}
                          >
                            {card.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-300">{card.year}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              card.isRecommended
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {card.isRecommended ? "Recommended" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
                              onClick={() => {
                                setEditingCard(card);
                                setForm({
                                  name: card.name,
                                  playerName: card.playerName,
                                  team: card.team,
                                  traderName: card.traderName ?? "",
                                  printRun: card.printRun ?? "",
                                  price: String(card.price),
                                  grade: card.grade,
                                  year: String(card.year),
                                  quantity: String(card.quantity),
                                  status: card.status,
                                  isRecommended: card.isRecommended,
                                  description: card.description,
                                });
                                setOpenEditDialog(true);
                                setOpenAddCardDialog(false);
                                setImagePreviews(
                                  buildOrderedImagePreviews(card.images),
                                );
                              }}
                            >
                              <DriveFileRenameOutlineOutlinedIcon fontSize="small" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(card.id)}
                              className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!inventoryLoading && cards.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-gray-400"
                      >
                        No cards matched your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-gray-400">
              Page {inventoryMeta.page} of {inventoryMeta.totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleInventoryPageChange(Math.max(1, inventoryMeta.page - 1))
                }
                disabled={inventoryMeta.page === 1}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>

              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handleInventoryPageChange(page)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    page === inventoryMeta.page
                      ? "bg-primary text-white"
                      : "border border-white/10 text-white hover:bg-white/5"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  handleInventoryPageChange(
                    Math.min(inventoryMeta.totalPages, inventoryMeta.page + 1),
                  )
                }
                disabled={inventoryMeta.page === inventoryMeta.totalPages}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default InventoryPage;
