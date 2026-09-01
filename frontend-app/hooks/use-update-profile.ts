import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/lib/api/profile";
import { useAuth } from "@/contexts/auth-context";
import { User } from "@/lib/auth";
import { ApiHttpError } from "@/lib/http";
import { toast } from "react-hot-toast";

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setUser(updatedUser);
       toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiHttpError) {
        toast.error(error.message || "Something went wrong");

        // Optionally handle validation errors
        if (error.errors) {
          Object.entries(error.errors).forEach(([field, msg]) => {
            console.log(`Field error: ${field} → ${msg}`);
          });
        }
      } else {
        toast.error("Failed to update profile");
      }
    }
  });
};
