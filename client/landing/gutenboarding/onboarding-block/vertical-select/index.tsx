/**
 * External dependencies
 */
import React, { createRef, useState, FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { Suggestions } from '@automattic/components';
import { ENTER } from '@wordpress/keycodes';
import { useI18n } from '@automattic/react-i18n';

/**
 * Internal dependencies
 */
import { STORE_KEY as ONBOARD_STORE } from '../../stores/onboard';
import { Verticals } from '@automattic/data-stores';
import { SiteVertical } from '../../stores/onboard/types';
import { StepProps } from '../stepper-wizard';
import Question from '../question';
import AnimatedPlaceholder from '../animated-placeholder';

/**
 * Style dependencies
 */
import './style.scss';

type Suggestion = SiteVertical & { category?: string };

const VERTICALS_STORE = Verticals.register();

const VerticalSelect: FunctionComponent< StepProps > = ( {
	onSelect,
	inputClass,
	isActive,
	onExpand,
} ) => {
	const { __: NO__ } = useI18n();
	const popular = [
		NO__( 'Travel Agency' ),
		NO__( 'Digital Marketing' ),
		NO__( 'Cameras & Photography' ),
		NO__( 'Website Designer' ),
		NO__( 'Restaurant' ),
		NO__( 'Fashion Designer' ),
		NO__( 'Real Estate Agent' ),
	];

	/**
	 * Ref to the <Suggestions />, necessary for handling input events
	 *
	 * This ref is effectively `any` and should therefore be considered _dangerous_.
	 *
	 * TODO: This should be a typed ref to Suggestions, but the component is not typed.
	 *
	 * Using `Suggestions` here would effectively be `any`.
	 */
	const suggestionRef = createRef< any >();

	const verticals = useSelect( select =>
		select( VERTICALS_STORE )
			.getVerticals()
			.map( x => ( {
				label: x.vertical_name,
				id: x.vertical_id,
			} ) )
	);

	const { siteVertical } = useSelect( select => select( ONBOARD_STORE ).getState() );
	const { setSiteVertical, resetSiteVertical } = useDispatch( ONBOARD_STORE );

	const [ inputValue, setInputValue ] = useState( siteVertical?.label ?? '' );

	const normalizedInputValue = inputValue.trim().toLowerCase();

	const handleSuggestionChangeEvent = ( e: React.ChangeEvent< HTMLInputElement > ) => {
		setInputValue( e.target.value );
	};

	const handleSuggestionKeyDown = ( e: React.KeyboardEvent< HTMLInputElement > ) => {
		if ( suggestionRef.current ) {
			if ( suggestionRef.current.props.suggestions.length && e.keyCode === ENTER ) {
				e.preventDefault();
			}

			suggestionRef.current.handleKeyEvent( e );
		}
	};

	const loadingMessage = [
		{
			label: '',
			category: NO__( 'Loading, please wait…' ),
		},
	];

	let suggestions: Suggestion[];

	if ( ! normalizedInputValue ) {
		suggestions = verticals
			.filter( vertical => popular.includes( vertical.label ) )
			.map( vertical => ( { ...vertical, category: NO__( 'Popular' ) } ) );
		resetSiteVertical();
	} else {
		suggestions = verticals.filter( vertical =>
			vertical.label.toLowerCase().includes( normalizedInputValue )
		);

		// Does the verticals list include an exact match? If it doesn't, we prepend the user-suppied
		// vertical to the list.
		if (
			! suggestions.some( suggestion => suggestion.label.toLowerCase() === normalizedInputValue )
		) {
			// User-supplied verticals don't have IDs.
			suggestions.unshift( { label: inputValue.trim() } );
		}

		// If there is only one suggestion and that suggestion matches the user input value,
		// do not show any suggestions.
		if (
			suggestions.length === 1 &&
			suggestions[ 0 ].label.toLowerCase() === normalizedInputValue
		) {
			suggestions = [];
		}
	}

	const handleSelect = ( vertical: SiteVertical ) => {
		setSiteVertical( vertical );
		setInputValue( vertical.label );
		onSelect();
	};

	const handleBlur = () => {
		const vertical = suggestions.find( ( { label } ) =>
			label.toLowerCase().includes( normalizedInputValue )
		) ?? { label: inputValue.trim() };

		setSiteVertical( vertical );
		onSelect();
	};

	const label = NO__( 'My site is about' );
	const displayValue = siteVertical?.label ?? '';

	// Focus the input when we change to active
	const inputRef = createRef< HTMLInputElement >();
	useEffect( () => {
		if ( isActive && document.activeElement !== inputRef.current ) {
			inputRef.current?.focus();
		}
	}, [ isActive, inputRef ] );

	return (
		<Question
			label={ label }
			displayValue={ displayValue }
			isActive={ isActive || ! displayValue }
			onExpand={ onExpand }
		>
			<div className="vertical-select">
				{ ! inputValue && (
					<AnimatedPlaceholder
						texts={ [
							NO__( 'football' ),
							NO__( 'shopping' ),
							NO__( 'cars' ),
							NO__( 'design' ),
							NO__( 'travel' ),
						] }
					/>
				) }
				<input
					aria-label={ label }
					autoComplete="off"
					className={ inputClass }
					onBlur={ handleBlur }
					onChange={ handleSuggestionChangeEvent }
					onKeyDown={ handleSuggestionKeyDown }
					placeholder=""
					ref={ inputRef }
					value={ inputValue }
				/>
				<div className="vertical-select__suggestions">
					{ inputValue && (
						<Suggestions
							ref={ suggestionRef }
							query={ inputValue }
							suggestions={ ! verticals.length ? loadingMessage : suggestions }
							suggest={ handleSelect }
							title={ NO__( 'Suggestions' ) }
						/>
					) }
				</div>
			</div>
		</Question>
	);
};

export default VerticalSelect;
