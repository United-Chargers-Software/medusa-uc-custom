import { toast } from "react-hot-toast"
import Notification, {
  NotificationTypes,
} from "../components/atoms/notification"

const useNotification = () => {
  return (
    title: string,
    message: string,
    type: NotificationTypes,
    options?: { duration?: number }
  ) => {
    toast.custom(
      (t) => (
        <Notification toast={t} type={type} title={title} message={message} />
      ),
      {
        position: "top-right",
        duration: options?.duration ?? 3000,
      }
    )
  }
}

export default useNotification
