import { AdminAnalyticsConfigRes } from "@medusajs/medusa"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { MEDUSA_BACKEND_URL } from "../constants/medusa-backend-url"
import { useFeatureFlag } from "../providers/feature-flag-provider"

// API

const ANALYTICS_BASE = "admin/analytics-configs"

const client = axios.create({
  baseURL: MEDUSA_BACKEND_URL,
  withCredentials: true,
})

/**
 * Returns true if analytics are enabled for the current user.
 */
export const analyticsOptIn = async () => {

  // Disable
  return false;

  const res = await getAnalyticsConfig().catch(() => undefined)

  // Don't track if we have no config to ensure we have permission
  if (!res) {
    return false
  }

  return !res.analytics_config.opt_out
}

/**
 * Fetches the analytics config for the current user.
 */
export const getAnalyticsConfig =
  async (): Promise<AdminAnalyticsConfigRes> => {
    const { data } = await client.get(ANALYTICS_BASE)
    return data
  }

type CreateConfigPayload = {
  opt_out: boolean
  anonymize?: boolean
}

/**
 * Creates a new analytics config for the current user.
 */
export const createAnalyticsConfig = async (
  payload: CreateConfigPayload
): Promise<AdminAnalyticsConfigRes> => {
  const { data } = await client.post(ANALYTICS_BASE, payload)
  return data
}

type UpdateConfigPayload = {
  opt_out?: boolean
  anonymize?: boolean
}

/**
 * Updates the users analytics config
 */
export const updateAnalyticsConfig = async (
  payload: UpdateConfigPayload
): Promise<AdminAnalyticsConfigRes> => {
  const { data } = await client.post(`${ANALYTICS_BASE}/update`, payload)
  return data
}

// Hooks

const ANALYTICS_CONFIG_KEY = ["analytics-config"]

const useInvalidateAnalyticsConfig = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries(ANALYTICS_CONFIG_KEY)
  }
}

export const useAdminAnalyticsConfig = () => {
  
  const { data, ...rest } = useQuery(
    ANALYTICS_CONFIG_KEY,
    async () => getAnalyticsConfig(),
    {
      retry: false,
      enabled: false,
    }
  )

  return { ...data, ...rest }
}

export const useAdminUpdateAnalyticsConfig = () => {
  const invalidateAnalyticsConfig = useInvalidateAnalyticsConfig()

  const mutation = useMutation(
    async (payload: UpdateConfigPayload) => updateAnalyticsConfig(payload),
    {
      onSuccess: invalidateAnalyticsConfig,
    }
  )

  return mutation
}

export const useAdminCreateAnalyticsConfig = () => {
  const invalidateAnalyticsConfig = useInvalidateAnalyticsConfig()

  const mutation = useMutation(
    async (payload: CreateConfigPayload) => createAnalyticsConfig(payload),
    {
      onSuccess: invalidateAnalyticsConfig,
    }
  )

  return mutation
}
