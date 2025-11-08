import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Flag, Star } from "lucide-react";

const ReportsReviewsTab = () => {
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Mock data
  useEffect(() => {
    const mockReports = [
      {
        id: "rep1",
        reporter_name: "Arjun Mehta",
        photographer_name: "Simran Kaur",
        reason: "Fake Profile",
        description: "This photographer is using stolen portfolio photos.",
        status: "pending",
        created_at: "2025-11-06T10:24:00Z",
      },
      {
        id: "rep2",
        reporter_name: "Riya Singh",
        photographer_name: "Rahul Gupta",
        reason: "Abusive Language",
        description: "Used inappropriate language in chat.",
        status: "reviewed",
        created_at: "2025-11-05T08:10:00Z",
      },
    ];

    const mockReviews = [
      {
        id: "rev1",
        photographer_name: "Simran Kaur",
        user_name: "Ananya Sharma",
        rating: 5,
        review_text: "Absolutely stunning work! Professional and creative.",
        created_at: "2025-11-06T12:10:00Z",
      },
      {
        id: "rev2",
        photographer_name: "Rahul Gupta",
        user_name: "Rohit Patel",
        rating: 4,
        review_text: "Great photos but delivery was a bit late.",
        created_at: "2025-11-06T11:20:00Z",
      },
    ];

    setReports(mockReports);
    setReviews(mockReviews);
  }, []);

  return (
    <div className="space-y-8 p-4">
      {/* Reports Section */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" /> User Reports
          </CardTitle>
          <Badge variant="outline" className="text-red-600 border-red-400">
            {reports.length} Reports
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length > 0 ? (
            reports.map((r) => (
              <div
                key={r.id}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-gray-800">{r.reason}</p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      r.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reporter:</span>{" "}
                  {r.reporter_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Photographer:</span>{" "}
                  {r.photographer_name}
                </p>
                <p className="text-sm text-gray-700 mt-2">{r.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(r.created_at).toLocaleString()}
                </p>
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-indigo-700 border-indigo-400"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">
              No reports available.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Reviews Section */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> User Reviews
          </CardTitle>
          <Badge variant="outline" className="text-yellow-700 border-yellow-400">
            {reviews.length} Reviews
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((r) => (
              <div
                key={r.id}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold text-gray-800 mb-1">
                  {r.photographer_name}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {"⭐".repeat(r.rating || 0)}
                </div>
                <p className="text-sm text-gray-700">{r.review_text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  By {r.user_name} •{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">
              No reviews available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsReviewsTab;
