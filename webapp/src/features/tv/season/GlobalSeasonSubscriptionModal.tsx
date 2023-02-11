import { Modal, notification } from "antd"
import { useAppDispatch, useAppSelector } from "../../../app/hook"
import SubscriptionForm from "./SubscriptionForm"
import { subscriptionActions, subscriptionSelector } from "./subscriptionSlice"

const GlobalSeasonSubscriptionModal: React.FC = () => {
    const dispatch = useAppDispatch()
    const sub = useAppSelector(subscriptionSelector)

    return <Modal
        title={sub.editId ? "Update subscription" : "Add a new subscription"}
        style={{ minWidth: '60vw' }}
        maskClosable={false}
        open={sub.open}
        onCancel={() => dispatch(subscriptionActions.closeSubscription())}
        footer={null}
    >
        <SubscriptionForm
            id='season-subscriber'
            editId={sub.editId}
            onFinish={async (task) => {
                try {
                    await task
                    dispatch(subscriptionActions.closeSubscription())
                } catch {
                    notification.error({ message: 'Failed to save subscription' })
                }
            }}
            season_id={sub.season}
            priority={sub.priority}
        />
    </Modal>

}

export default GlobalSeasonSubscriptionModal