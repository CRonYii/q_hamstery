import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useAppDispatch } from '../../app/hook';
import { RootState } from '../../app/store';

type ResponsiveMode = 'desktop' | 'tablet' | 'mobile'

interface DimensionSetting {
    width: number
}

const defaultMode: ResponsiveMode = 'desktop' // Must be the largest mode due to the way we compute modes

const dimensions: Record<ResponsiveMode, DimensionSetting> = {
    'mobile': {
        width: 480
    },
    'tablet': {
        width: 768
    },
    'desktop': {
        width: 1112
    },
}

// Make sure the modes range from the smallest to the largest
const modes: ResponsiveMode[] = ['mobile', 'tablet', 'desktop']

const getWindowDimensions = () => {
    const { width, height } = window.screen;
    return {
        width,
        height
    };
}

const computeResponsiveMode = () => {
    const { width } = getWindowDimensions();
    let mode: ResponsiveMode = defaultMode
    for (const key of modes) {
        const dimension: DimensionSetting = dimensions[key]
        if (width <= dimension.width) {
            mode = key
            break
        }
    }
    return mode
}

interface IResponsive {
    mode: ResponsiveMode,
    size: {
        height: number,
        width: number,
    }
}

const initialState: IResponsive = {
    mode: computeResponsiveMode(),
    size: getWindowDimensions(),
}

const responsiveSlice = createSlice({
    name: 'responsive',
    initialState,
    reducers: {
        update(state, action: PayloadAction<{
            mode: ResponsiveMode, size: {
                height: number,
                width: number,
            }
        }>) {
            state.mode = action.payload.mode
            state.size = action.payload.size
        },
    },
});

export const responsiveAction = responsiveSlice.actions;

export const responsiveSelector = (state: RootState) => state.responsive

type ResponsiveValues<T> = Partial<Record<ResponsiveMode, T>>

type ResponsiveModeCompute = <T>(values: Partial<Record<ResponsiveMode, T>>) => T | undefined

export const responsiveComputeSelector = (state: RootState): ResponsiveModeCompute => function <T>(values: ResponsiveValues<T>): T | undefined {
    let mode = state.responsive.mode
    if (mode in values) {
        return values[mode]
    }
    let idx = modes.indexOf(mode) + 1
    for (; idx < modes.length; idx++) {
        mode = modes[idx]
        if (mode in values) {
            return values[mode]
        }
    }
}

export default responsiveSlice.reducer;

export const useResponsiveUpdater = () => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        const handleResize = () => {
            dispatch(responsiveAction.update({ mode: computeResponsiveMode(), size: getWindowDimensions() }))
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dispatch]);
}
const responsiveCardSize: ResponsiveValues<number> = {
    'mobile': 160,
    'tablet': 200,
    'desktop': 350,
}

export const useResponsiveCardSize = (modeCompute: ResponsiveModeCompute) => {
    return modeCompute<number>(responsiveCardSize)
}