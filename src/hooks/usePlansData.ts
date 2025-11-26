import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setPlans, setCustomRequests, updateCustomRequest as updateCustomRequestAction, setLoading } from '@/store/slices/plansSlice';
import type { Plan, CustomPlanRequest } from '@/store/slices/plansSlice';
import { useGetAllPlansQuery, useGetCustomPlanRequestsQuery, useUpdateCustomPlanRequestMutation } from '@/store/api/plansApi';

export const usePlansData = () => {
  const dispatch = useAppDispatch();
  const { plans: storedPlans, customRequests: storedCustomRequests, loading } = useAppSelector(state => state.plans);

  // Fetch plans from API
  const { data: plansData, isLoading: isLoadingPlans, error: plansError } = useGetAllPlansQuery({});
  
  // Fetch custom plan requests from API
  const { data: customRequestsData, isLoading: isLoadingRequests, error: requestsError } = useGetCustomPlanRequestsQuery();
  
  // Mutation for updating custom plan requests
  const [updateRequestApi] = useUpdateCustomPlanRequestMutation();

  // Update Redux store when API data changes
  useEffect(() => {
    if (plansData) {
      // Transform API response to match the Plan type
      const transformedPlans = plansData.map(plan => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        isCustom: false,
        isActive: plan.isActive,
        discount: plan.discount ? {
          percentage: plan.discount.type === 'percentage' ? plan.discount.value : 0,
          validUntil: plan.discount.endDate || ''
        } : undefined,
        createdAt: new Date().toISOString()
      }));
      
      dispatch(setPlans(transformedPlans));
    }
  }, [plansData, dispatch]);

  // Update custom requests in Redux store
  useEffect(() => {
    if (customRequestsData) {
      // Transform API response to match CustomPlanRequest type if needed
      const transformedRequests = customRequestsData.map((request: any) => ({
        ...request,
        // Add any necessary transformations here
      }));
      
      dispatch(setCustomRequests(transformedRequests));
    }
  }, [customRequestsData, dispatch]);

  // Update loading state
  useEffect(() => {
    dispatch(setLoading(isLoadingPlans || isLoadingRequests));
  }, [isLoadingPlans, isLoadingRequests, dispatch]);

  // Handle errors
  useEffect(() => {
    if (plansError) {
      console.error('Error fetching plans:', plansError);
      // You might want to show a toast notification here
    }
    
    if (requestsError) {
      console.error('Error fetching custom requests:', requestsError);
      // You might want to show a toast notification here
    }
  }, [plansError, requestsError]);

  // Update custom request status
  const updateCustomRequest = useMemo(
    () => async (request: { id: string; status: 'approved' | 'rejected'; response?: string }) => {
      try {
        await updateRequestApi({
          id: request.id,
          status: request.status,
          response: request.response
        }).unwrap();
        
        // Update local state optimistically
        dispatch(updateCustomRequestAction(request));
        return Promise.resolve();
      } catch (error) {
        console.error('Failed to update request:', error);
        return Promise.reject(error);
      }
    },
    [dispatch, updateRequestApi]
  );

  return { 
    plans: storedPlans, 
    customRequests: storedCustomRequests, 
    loading, 
    updateCustomRequest,
    error: plansError || requestsError 
  };
};

export default usePlansData;

