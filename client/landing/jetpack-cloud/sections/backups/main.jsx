/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { isMobile } from '@automattic/viewport';
import page from 'page';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import DocumentHead from 'components/data/document-head';
import { Card } from '@automattic/components';
import { updateFilter } from 'state/activity-log/actions';
import { getBackupAttemptsForDate, getDailyBackupDeltas, getEventsInDailyBackup } from './utils';
import { getSelectedSiteId } from 'state/ui/selectors';
import { requestActivityLogs } from 'state/data-getters';
import { withLocalizedMoment } from 'components/localized-moment';
import BackupDelta from '../../components/backup-delta';
import DailyBackupStatus from '../../components/daily-backup-status';
import DatePicker from '../../components/date-picker';
import getRewindState from 'state/selectors/get-rewind-state';
import getSelectedSiteSlug from 'state/ui/selectors/get-selected-site-slug';
import QueryRewindState from 'components/data/query-rewind-state';
import QuerySitePurchases from 'components/data/query-site-purchases';
import Main from 'components/main';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import getActivityLogFilter from 'state/selectors/get-activity-log-filter';
import Filterbar from 'my-sites/activity/filterbar';
import ActivityCard from '../../components/activity-card';
import siteSupportsRealtimeBackup from 'state/selectors/site-supports-realtime-backup';
import Pagination from 'components/pagination';
import MissingCredentialsWarning from '../../components/missing-credentials';
import getDoesRewindNeedCredentials from 'state/selectors/get-does-rewind-need-credentials.js';
import getIsRewindMissingPlan from 'state/selectors/get-is-rewind-missing-plan';
import BackupUpsell from './components/upsell';

/**
 * Style dependencies
 */
import './style.scss';

const PAGE_SIZE = 10;

class BackupsPage extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selectedDate: new Date(),
		};
	}

	onDateChange = date => {
		this.setState( { selectedDate: date } );
	};

	isEmptyFilter = filter => {
		if ( ! filter ) {
			return true;
		}
		if ( filter.group || filter.on || filter.before || filter.after ) {
			return false;
		}
		if ( filter.page !== 1 ) {
			return false;
		}
		return true;
	};

	TO_REMOVE_getSelectedDateString = () => {
		const { moment } = this.props;
		const { selectedDate } = this.state;
		return moment.parseZone( selectedDate ).toISOString( true );
	};

	renderMain() {
		const { isRewindMissingPlan, siteId, siteSlug } = this.props;

		return (
			<Main>
				<DocumentHead title="Backups" />
				<SidebarNavigation />
				<QueryRewindState siteId={ siteId } />
				<QuerySitePurchases siteId={ siteId } />
				{ isRewindMissingPlan ? (
					<Card>
						<BackupUpsell siteSlug={ siteSlug } />
					</Card>
				) : (
					this.renderBackupPicker()
				) }
			</Main>
		);
	}

	changePage = pageNumber => {
		this.props.selectPage( this.props.siteId, pageNumber );
		window.scrollTo( 0, 0 );
	};

	renderBackupPicker() {
		const {
			allowRestore,
			doesRewindNeedCredentials,
			hasRealtimeBackups,
			logs,
			moment,
			siteId,
			siteSlug,
		} = this.props;
		const { selectedDate } = this.state;
		const selectedDateString = this.TO_REMOVE_getSelectedDateString();

		const backupAttempts = getBackupAttemptsForDate( logs, selectedDateString );
		const deltas = getDailyBackupDeltas( logs, selectedDateString );
		const realtimeEvents = getEventsInDailyBackup( logs, selectedDateString );
		return (
			<>
				<DatePicker
					onDateChange={ this.onDateChange }
					selectedDate={ selectedDate }
					siteId={ siteId }
				/>
				<DailyBackupStatus
					allowRestore={ allowRestore }
					date={ selectedDateString }
					backupAttempts={ backupAttempts }
					siteSlug={ siteSlug }
				/>
				{ doesRewindNeedCredentials && (
					<MissingCredentialsWarning settingsLink={ `/settings/${ siteSlug }` } />
				) }
				<BackupDelta
					{ ...{
						deltas,
						backupAttempts,
						hasRealtimeBackups,
						realtimeEvents,
						allowRestore,
						moment,
						siteSlug,
					} }
				/>
			</>
		);
	}

	renderActivityLog() {
		const { allowRestore, filter, logs, moment, siteId } = this.props;
		const { page: requestedPage } = filter;

		const actualPage = Math.max(
			1,
			Math.min( requestedPage, Math.ceil( logs.length / PAGE_SIZE ) )
		);
		const theseLogs = logs.slice( ( actualPage - 1 ) * PAGE_SIZE, actualPage * PAGE_SIZE );

		const cards = theseLogs.map( activity => (
			<ActivityCard
				{ ...{
					key: activity.activityId,
					moment,
					activity,
					allowRestore,
				} }
			/>
		) );

		return (
			<div>
				<div>Find a backup or restore point</div>
				<div>
					This is the complete event history for your site. Filter by date range and/ or activity
					type.
				</div>
				<Filterbar
					{ ...{
						siteId,
						filter,
						isLoading: false,
						isVisible: true,
					} }
				/>
				<Pagination
					compact={ isMobile() }
					className="backups__pagination"
					key="backups__pagination-top"
					nextLabel={ 'Older' }
					page={ actualPage }
					pageClick={ this.changePage }
					perPage={ PAGE_SIZE }
					prevLabel={ 'Newer' }
					total={ logs.length }
				/>
				{ cards }
				<Pagination
					compact={ isMobile() }
					className="backups__pagination"
					key="backups__pagination-bottom"
					nextLabel={ 'Older' }
					page={ actualPage }
					pageClick={ this.changePage }
					perPage={ PAGE_SIZE }
					prevLabel={ 'Newer' }
					total={ logs.length }
				/>
			</div>
		);
	}

	render() {
		const { filter } = this.props;

		return (
			<div className="backups__page">
				{ ! this.isEmptyFilter( filter ) ? this.renderActivityLog() : this.renderMain() }
			</div>
		);
	}
}

const mapStateToProps = state => {
	const siteId = getSelectedSiteId( state );

	//The section require a valid site, if not, redirect to backups
	if ( false === !! siteId ) {
		return page.redirect( '/backups' );
	}

	const filter = getActivityLogFilter( state, siteId );
	const logs = siteId && requestActivityLogs( siteId, filter );
	const rewind = getRewindState( state, siteId );
	const restoreStatus = rewind.rewind && rewind.rewind.status;
	const doesRewindNeedCredentials = getDoesRewindNeedCredentials( state, siteId );
	const allowRestore =
		'active' === rewind.state && ! ( 'queued' === restoreStatus || 'running' === restoreStatus );

	return {
		allowRestore,
		doesRewindNeedCredentials,
		filter,
		hasRealtimeBackups: siteSupportsRealtimeBackup( state, siteId ),
		isRewindMissingPlan: getIsRewindMissingPlan( state, siteId ),
		logs: logs?.data ?? [],
		rewind,
		siteId,
		siteSlug: getSelectedSiteSlug( state ),
	};
};

const mapDispatchToProps = dispatch => ( {
	selectPage: ( siteId, pageNumber ) => dispatch( updateFilter( siteId, { page: pageNumber } ) ),
} );

export default connect( mapStateToProps, mapDispatchToProps )( withLocalizedMoment( BackupsPage ) );
