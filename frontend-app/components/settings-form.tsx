"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Eye, EyeOff, Loader2, CheckCircle2, Check, X } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"
import { useAuth } from "@/contexts/auth-context"
import { getUserAvatar } from "@/lib/utils"
import { useUpdateProfile } from "@/hooks/use-update-profile"
import { ProtectedRoute } from "./protected-route"

export function SettingsForm() {
  const { user } = useAuth();
  const [fullname, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  // const [website, setWebsite] = useState("https://johndoe.dev")
  const [hasChanges, setHasChanges] = useState(false)

  // Check username
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState<string|undefined>("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [replyNotifications, setReplyNotifications] = useState(true)
  const [mentionNotifications, setMentionNotifications] = useState(true)
  const [likeNotifications, setLikeNotifications] = useState(false)

  // Privacy settings
  const [profilePublic, setProfilePublic] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [showActivity, setShowActivity] = useState(true)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (user) {
      setFullName(user.fullname);
      setUsername(user.username);
      setEmail(user.email);
      console.log(user.bio)
      setBio(user.bio || "");
    }
  }, [user]);



  const { mutate: updateProfile, isPending, isSuccess, error } = useUpdateProfile()
  

  useEffect(() => {
    if (isSuccess) {
      setHasChanges(false);
      setAvatar(null);
      setUsernameAvailable(null)
    }
  }, [isSuccess]);

  // save profile update
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanges) {
      return;
    }
    updateProfile({fullname,username,bio,avatar})
  }

  // watch changes to fullname, username, bio, avatar
  useEffect(() => {
    if (!user) return; //  exit early

    const hasProfileChanges =
      fullname !== user.fullname ||
      username !== user.username ||
      bio !== (user.bio || "") ||
      avatar !== null;

    setHasChanges(hasProfileChanges);
  }, [fullname, username, bio, avatar, user]);

  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleAvatarUpload = (file: File) => {
    setAvatar(file);
  }

  // username avaliable check real-time
  const { checkUsernameAvailable } = useAuth()

  useEffect(() => {
      if (!username || username.length < 3 || username === user?.username) {
        setUsernameAvailable(null)
        setUsernameError("")
        return
      }

      const controller = new AbortController()
      const signal = controller.signal

      const timeoutId = setTimeout(async () => {
        try {
          setIsCheckingUsername(true)
          const { valid, available, message } = await checkUsernameAvailable(username)
          setUsernameAvailable(valid && available)
          setUsernameError(!valid || !available ? message : "");
        } catch (err: any) {
          if (err.name !== "AbortError") {
            setUsernameError("Failed to check username availability")
          }
        } finally {
          setIsCheckingUsername(false)
        }
      }, 500)

      return () => {
        clearTimeout(timeoutId)
        controller.abort()
      }
    }, [username]);

  const avatarUrl = getUserAvatar(user?.avatar_path);

  return (
    <ProtectedRoute>
      <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="bg-muted">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile details and how others see you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarUpload currentAvatar={avatarUrl ?? undefined} fallback="JD" onUpload={handleAvatarUpload} />

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={fullname}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-muted border-border"
                    />
                    {username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : usernameAvailable === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {usernameError && <p className={`text-xs ${usernameError==='OK'?'text-green-500':'text-red-500'}`}>{usernameError}</p>}
                  {!usernameError && username.length >= 3 && usernameAvailable && (
                    <p className="text-xs text-green-500">Username is available</p>
                  )}
                  {username.length < 3 && username.length > 0 && (
                    <p className="text-xs text-muted-foreground">Must be at least 3 characters</p>
                  )}
                </div>
                </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-muted border-border resize-none"
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                />
                <p className="text-xs text-muted-foreground">{bio.length}/160 characters</p>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="bg-muted border-border"
                />
              </div> */}

                <Button type="submit" className="gap-2 cursor-pointer" disabled={isPending || !hasChanges}>
                {isPending ? (
                  <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                  </>
                ) : (
                  <>
                  <Save className="h-4 w-4" />
                  Save Changes
                  </>
                )}
                </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Tab */}
      <TabsContent value="account">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Change Email</CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-email">Current Email</Label>
                  <div className="relative">
                  <Input id="current-email" type="email" value={email} disabled className="bg-muted border-border" />
                  {user?.email_verified ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-500">Verified</span>
                    </div>
                  ) : (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <X className="h-5 w-5 " />
                    <span className="text-sm ">Not Verified</span>
                    </div>
                  )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-email">New Email Address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="bg-muted border-border"
                  />
                </div>

                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Update Email
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-muted border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-muted border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-muted border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reply-notifications">Reply Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone replies to your posts</p>
                </div>
                <Switch id="reply-notifications" checked={replyNotifications} onCheckedChange={setReplyNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mention-notifications">Mention Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                </div>
                <Switch
                  id="mention-notifications"
                  checked={mentionNotifications}
                  onCheckedChange={setMentionNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="like-notifications">Like Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone likes your posts</p>
                </div>
                <Switch id="like-notifications" checked={likeNotifications} onCheckedChange={setLikeNotifications} />
              </div>
            </div>

            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy Tab */}
      <TabsContent value="privacy">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control who can see your information and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-public">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
                </div>
                <Switch id="profile-public" checked={profilePublic} onCheckedChange={setProfilePublic} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-email">Show Email</Label>
                  <p className="text-sm text-muted-foreground">Display your email address on your profile</p>
                </div>
                <Switch id="show-email" checked={showEmail} onCheckedChange={setShowEmail} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-activity">Show Activity</Label>
                  <p className="text-sm text-muted-foreground">Let others see your recent activity</p>
                </div>
                <Switch id="show-activity" checked={showActivity} onCheckedChange={setShowActivity} />
              </div>
            </div>

            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </ProtectedRoute>
  )
}
