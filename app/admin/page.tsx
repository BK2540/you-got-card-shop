/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CustomButton from "@/components/CustomButton";
import { useAdminPortal } from "@/context/AdminPortalContext";
import { createCard, deleteCard, getCards, updateCard } from "@/lib/api/cards";
import { getCustomers } from "@/lib/api/customers";
import { getOrders } from "@/lib/api/orders";
import { Card, CardImage } from "@/types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DriveFileRenameOutlineOutlinedIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import CustomInput from "@/components/CustomInput";

type UploadPreview = {
  id?: string;
  fileName: string;
  url: string;
  file?: File;
  isExisting: boolean;
};

const MAX_IMAGE_COUNT = 10;

export default function AdminPage() {
  const { tab } = useAdminPortal();
  const [cards, setCards] = useState<Card[]>([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<UploadPreview[]>([]);
  const [openAddCardDialog, setOpenAddCardDialog] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewsRef = useRef<UploadPreview[]>([]);

  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const [homeForm, setHomeForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    featuredId: "",
  });

  const [homeCards, setHomeCards] = useState([]);

  const [form, setForm] = useState({
    name: "",
    team: "",
    price: "",
    grade: "",
    year: "2024",
  });

  // fetch cards
  const fetchCards = async () => {
    const data = await getCards();
    setCards(data);
    return data;
  };

  // load on mount
  useEffect(() => {
    let mounted = true;

    getCards().then((data) => {
      if (mounted) setCards(data);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (tab === "orders") {
      getOrders().then(setOrders);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "customers") {
      getCustomers().then(setCustomers);
    }
  }, [tab]);

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

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        if (data) setHomeForm(data);
      });

    fetch("/api/cards")
      .then((res) => res.json())
      .then(setHomeCards);
  }, []);

  const handleHomeContentSubmit = async (e) => {
    e.preventDefault();

    await fetch("/api/home", {
      method: "PUT",
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
      }),
    });

    alert("Updated!");
  };

  const resetForm = () => {
    imagePreviewsRef.current.forEach((preview) => {
      if (!preview.isExisting) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setForm({
      name: "",
      team: "",
      price: "",
      grade: "",
      year: "2024",
    });
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

  // create
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    const price = Number(form.price || 0);
    const year = Number(form.year || 0);
    const imageOrder = imagePreviews.map((preview) =>
      preview.isExisting
        ? { type: "existing" as const, url: preview.url }
        : { type: "new" as const },
    );

    formData.append("name", form.name);
    formData.append("team", form.team);
    formData.append("price", String(price));
    formData.append("grade", form.grade);
    formData.append("year", String(year));
    formData.append("heroIndex", "0");
    formData.append("imageOrder", JSON.stringify(imageOrder));
    imagePreviews.forEach((preview) => {
      if (preview.file) {
        formData.append("images", preview.file);
      }
    });
    imagePreviews
      .filter((preview) => preview.isExisting)
      .forEach((preview) => {
        formData.append("existingImageUrls", preview.url);
      });

    try {
      await createCard(formData);

      resetForm();
      await fetchCards();
    } finally {
      setLoading(false);
      setOpenAddCardDialog(false);
    }
  };

  // delete
  const handleDelete = async (id: string) => {
    await deleteCard(id);
    fetchCards();
  };

  const handleCloseDialog = () => {
    setOpenAddCardDialog(false);
    if (!editingCard) {
      resetForm();
    }
  };

  const handleNumberInputChange =
    (field: "price" | "year") => (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value.replace(/[^\d]/g, "");

      setForm((current) => ({
        ...current,
        [field]: nextValue,
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
        .slice(0, Math.max(0, MAX_IMAGE_COUNT - current.length))
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

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingCard) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("team", form.team);
    formData.append("price", String(Number(form.price || 0)));
    formData.append("grade", form.grade);
    formData.append("year", String(Number(form.year || 0)));
    formData.append("heroIndex", "0");
    formData.append(
      "imageOrder",
      JSON.stringify(
        imagePreviews.map((preview) =>
          preview.isExisting
            ? { type: "existing" as const, url: preview.url }
            : { type: "new" as const },
        ),
      ),
    );

    imagePreviews.forEach((preview) => {
      if (preview.file) {
        formData.append("images", preview.file);
      }
    });
    imagePreviews
      .filter((preview) => preview.isExisting)
      .forEach((preview) => {
        formData.append("existingImageUrls", preview.url);
      });

    try {
      await updateCard(editingCard.id, formData);

      await fetchCards();
      setOpenEditDialog(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const isFormIncomplete =
    form.name.trim() === "" ||
    form.team.trim() === "" ||
    form.price.trim() === "" ||
    form.grade.trim() === "" ||
    form.year.trim() === "" ||
    imagePreviews.length === 0;

  return (
    <div className="min-h-screen w-full text-white">
      {tab === "dashboard" && (
        <main className="space-y-8 p-8">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/80">
              Admin Overview
            </p>
            <h1 className="text-3xl font-bold text-orange-500">Dashboard</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <p className="text-sm text-gray-400">Inventory Count</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {cards.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <p className="text-sm text-gray-400">Orders Loaded</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {orders.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <p className="text-sm text-gray-400">Customers Loaded</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {customers.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface p-6">
            <p className="text-lg font-semibold text-white">
              Choose a section from the sidebar to manage cards, orders, or
              customers.
            </p>
          </div>
        </main>
      )}

      {/* MAIN */}
      {tab === "inventory" && (
        <main className="flex-1 p-8 space-y-10">
          <h1 className="text-2xl font-bold text-orange-500">Inventory</h1>
          <div className="flex justify-end">
            <CustomButton
              title="Add new card"
              onClick={() => {
                resetForm();
                setOpenAddCardDialog(true);
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORM */}
            <Dialog
              open={openAddCardDialog}
              onClose={handleCloseDialog}
              sx={{
                "& .MuiDialog-paper": {
                  backgroundColor: "#1a1a1a",
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                },
              }}
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
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />

                      <CustomInput
                        placeholder="Team*"
                        value={form.team}
                        onChange={(e) =>
                          setForm({ ...form, team: e.target.value })
                        }
                      />

                      <CustomInput
                        type="text"
                        inputMode="numeric"
                        placeholder="Price*"
                        value={form.price}
                        onChange={handleNumberInputChange("price")}
                      />

                      <div className="">
                        <p className="text-primary">
                          Card Image*{" "}
                          <span className="text-gray40 text-xs font-light">
                            Max {MAX_IMAGE_COUNT} images
                          </span>
                        </p>
                      </div>

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
                              {index === 0
                                ? `${preview.fileName} (hero)`
                                : preview.fileName}
                            </p>
                          </div>
                        ))}

                        {imagePreviews.length < MAX_IMAGE_COUNT && (
                          <label className="flex h-[112px] w-[176px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-primary p-4 text-center transition hover:bg-white/5">
                            <p>Add Card Image</p>
                            <AddPhotoAlternateIcon className="h-10 w-10" />
                            <p className="text-xs text-gray-400">
                              {MAX_IMAGE_COUNT - imagePreviews.length} slots
                              left
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

            {/* TABLE */}
            <div className="bg-surface rounded-3xl shadow-xl p-6 w-full">
              <h2 className="text-lg font-bold mb-4">Active Inventory</h2>

              <table className="w-full text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-t border-gray-700">
                      <td className="py-2">{card.name}</td>
                      <td>{card.grade}</td>
                      <td>${card.price}</td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setForm({
                              name: card.name,
                              team: card.team,
                              price: String(card.price),
                              grade: card.grade,
                              year: String(card.year),
                            });
                            setImagePreviews(
                              buildOrderedImagePreviews(card.images),
                            );

                            setOpenEditDialog(true);
                          }}
                        >
                          <DriveFileRenameOutlineOutlinedIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="text-white"
                        >
                          <DeleteOutlineOutlinedIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* HOME */}
      {tab === "home" && (
        <main className="flex-1 p-8 space-y-10">
          <h1 className="text-2xl font-bold text-orange-500">Home Content</h1>

          {/* <form onSubmit={handleHomeContentSubmit} className="space-y-4">
            <input
              placeholder="Title"
              value={homeForm.title}
              onChange={(e) => setForm({ ...homeForm, title: e.target.value })}
            />

            <input
              placeholder="Subtitle"
              value={homeForm.subtitle}
              onChange={(e) =>
                setForm({ ...homeForm, subtitle: e.target.value })
              }
            />

            <textarea
              placeholder="Description"
              value={homeForm.description}
              onChange={(e) =>
                setForm({ ...homeForm, description: e.target.value })
              }
            />

            <input
              placeholder="Price"
              value={homeForm.price}
              onChange={(e) => setForm({ ...homeForm, price: e.target.value })}
            />

            <select
              value={homeForm.featuredId}
              onChange={(e) =>
                setForm({ ...homeForm, featuredId: e.target.value })
              }
            >
              <option value="">Select Card</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>

            <button className="bg-orange-500 px-4 py-2">Save</button>
          </form> */}
        </main>
      )}

      {tab === "orders" && (
        <div className="flex-1 p-8 space-y-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-orange-500">Orders</h1>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name}</td>
                  <td>${order.total}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "customers" && (
        <div className="flex-1 p-8 space-y-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-orange-500">Customers</h1>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          resetForm();
        }}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#1a1a1a",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
          },
        }}
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
                placeholder="Team"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
              />

              <CustomInput
                placeholder="Price"
                value={form.price}
                onChange={handleNumberInputChange("price")}
              />

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
                      {index === 0
                        ? `${preview.fileName} (hero)`
                        : preview.fileName}
                    </p>
                  </div>
                ))}

                {imagePreviews.length < MAX_IMAGE_COUNT && (
                  <label className="flex h-[112px] w-[176px] cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-primary p-4 text-center transition hover:bg-white/5">
                    <p>Add Card Image</p>
                    <AddPhotoAlternateIcon className="h-10 w-10" />
                    <p className="text-xs text-gray-400">
                      {MAX_IMAGE_COUNT - imagePreviews.length} slots left
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
    </div>
  );
}
