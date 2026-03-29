"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, RefreshCw, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { unwrap } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  event?: { id: string; title: string };
}

const mockReviews: Review[] = [
  {
    id: "rv1",
    rating: 5,
    comment: "Absolutely incredible night! The lineup was fire and the vibes were immaculate. Already looking forward to the next one.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { id: "u1", firstName: "Grace", lastName: "Wanjiku" },
    event: { id: "e1", title: "Afro Fridays Vol. 12" },
  },
  {
    id: "rv2",
    rating: 4,
    comment: "Great event overall. The venue was well organised and crowd management was on point. Minor gripe was the queue at the bar.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: { id: "u2", firstName: "John", lastName: "Kamau" },
    event: { id: "e2", title: "Nairobi Jazz Festival" },
  },
  {
    id: "rv3",
    rating: 2,
    comment: "Disappointed with the sound quality. The headliner started 2 hours late with no communication.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    user: { id: "u3", firstName: "Amina", lastName: "Hassan" },
    event: { id: "e3", title: "Klub Reloaded" },
  },
  {
    id: "rv4",
    rating: 5,
    comment: "Best New Year party in Nairobi hands down! Perfect execution from start to finish.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    user: { id: "u4", firstName: "Kevin", lastName: "Odhiambo" },
    event: { id: "e4", title: "NYE Countdown 2025" },
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reviews", {
        params: { search: search || undefined, limit: 50 },
      });
      const data = unwrap<{ items: Review[] }>(res);
      setReviews(data.items ?? []);
    } catch {
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const deleteReview = async (id: string) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      loadReviews();
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage event reviews from attendees
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReviews} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{avgRating}</span>
              <div>
                <StarRow rating={Math.round(Number(avgRating))} />
                <p className="text-xs text-gray-400 mt-0.5">{reviews.length} reviews total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rating Distribution</p>
            <div className="space-y-1">
              {distribution.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right text-gray-500">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          placeholder="Search by event or reviewer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="dark:bg-gray-800 dark:border-gray-700"
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D93B2F] to-[#c0392b] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {review.user?.firstName?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {review.user
                            ? `${review.user.firstName} ${review.user.lastName}`
                            : "Anonymous"}
                        </p>
                        <StarRow rating={review.rating} />
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.event && (
                        <p className="text-xs text-[#D93B2F] mt-0.5">{review.event.title}</p>
                      )}
                      {review.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReview(review.id)}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
