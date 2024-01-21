import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useAppDispatch } from '../../app/hook';
import { RootState } from '../../app/store';

type ResponsiveMode = 'desktop' | 'mobile'

const getWindowDimensions = () => {
    const { width, height } = window.screen;
    return {
        width,
        height
    };
}

const computeResponsiveMode = () => {
    const { width } = getWindowDimensions();
    let mode: ResponsiveMode = 'desktop'
    if (width < 414) {
        mode = 'mobile'
    }
    return mode
}

interface IResponsive {
    mode: ResponsiveMode
}

const initialState: IResponsive = {
    mode: computeResponsiveMode()
}

const responsiveSlice = createSlice({
    name: 'responsive',
    initialState,
    reducers: {
        update(state, action: PayloadAction<{ mode: ResponsiveMode }>) {
            state.mode = action.payload.mode
        },
    },
});

export const responsiveAction = responsiveSlice.actions;

export const responsiveModeSelector = (state: RootState) => state.responsive.mode

export default responsiveSlice.reducer;

export const useResponsiveUpdater = () => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        const handleResize = () => {
            dispatch(responsiveAction.update({ mode: computeResponsiveMode() }))
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dispatch]);
}