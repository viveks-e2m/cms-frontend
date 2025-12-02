import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import "./OverdueRenewalsModal.css";

const OverdueRenewalsModal = ({ open, onClose, overdueEvents, onClientClick }) => {
  if (!overdueEvents || overdueEvents.length === 0) {
    return null;
  }

  // Sort events by renewal date (oldest first)
  const sortedEvents = [...overdueEvents].sort((a, b) => {
    const dateA = a.start instanceof Date ? a.start : new Date(a.start);
    const dateB = b.start instanceof Date ? b.start : new Date(b.start);
    return dateA - dateB;
  });

  // Calculate days overdue for each event
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatRenewalDate = (date) => {
    if (!date) return "Unknown";
    const renewalDate = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(renewalDate.getTime())) return "Invalid Date";
    return format(renewalDate, "MMM dd, yyyy");
  };

  const calculateDaysOverdue = (date) => {
    if (!date) return 0;
    const renewalDate = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(renewalDate.getTime())) return 0;
    renewalDate.setHours(0, 0, 0, 0);
    const diffTime = today - renewalDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleClientClick = (event) => {
    if (event?.clientId && onClientClick) {
      onClientClick(event.clientId);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "overdue-renewals-modal-paper",
      }}
    >
      <DialogTitle className="overdue-renewals-modal-title">
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box display="flex" alignItems="flex-start" gap={1}>
            <CalendarIcon className="overdue-renewals-modal-icon" />
            <Box>
              <Typography variant="h6" className="overdue-renewals-modal-title-text">
                Overdue Renewals
              </Typography>
              <Typography variant="body2" className="overdue-renewals-modal-subtitle">
                {sortedEvents.length} {sortedEvents.length === 1 ? "client" : "clients"} with overdue renewal dates
              </Typography>
            </Box>
          </Box>
          <button
            onClick={onClose}
            className="overdue-renewals-modal-close-btn"
            type="button"
          >
            <CloseIcon />
          </button>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent className="overdue-renewals-modal-content">
        {sortedEvents.length === 0 ? (
          <Box className="overdue-renewals-modal-empty">
            <Typography variant="body1" color="textSecondary">
              No overdue renewals found.
            </Typography>
          </Box>
        ) : (
          <List className="overdue-renewals-modal-list">
            {sortedEvents.map((event, index) => {
              const daysOverdue = calculateDaysOverdue(event.start);
              const renewalDate = formatRenewalDate(event.start);
              const clientName = event.title || event.company || "Unnamed Client";

              return (
                <React.Fragment key={event.id || `event-${index}`}>
                  <ListItem
                    className="overdue-renewals-modal-list-item"
                    onClick={() => handleClientClick(event)}
                    button
                  >
                    <Box className="overdue-renewals-modal-item-content">
                      <Box className="overdue-renewals-modal-item-header">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BusinessIcon className="overdue-renewals-modal-item-icon" />
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                className="overdue-renewals-modal-client-name"
                              >
                                {clientName}
                              </Typography>
                            }
                            secondary={
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mt={0.5}
                              >
                                <CalendarIcon className="overdue-renewals-modal-date-icon" />
                                <Typography
                                  variant="body2"
                                  className="overdue-renewals-modal-date-text"
                                >
                                  {renewalDate}
                                </Typography>
                                {daysOverdue > 0 && (
                                  <Typography
                                    variant="caption"
                                    className="overdue-renewals-modal-days-overdue"
                                  >
                                    ({daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue)
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </Box>
                        <ArrowForwardIcon className="overdue-renewals-modal-arrow-icon" />
                      </Box>
                    </Box>
                  </ListItem>
                  {index < sortedEvents.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <Divider />

      <DialogActions className="overdue-renewals-modal-actions">
        <Button
          onClick={onClose}
          variant="outlined"
          className="overdue-renewals-modal-close-button"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

OverdueRenewalsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  overdueEvents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      start: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
      clientId: PropTypes.string,
      company: PropTypes.string,
      isOverdue: PropTypes.bool,
    })
  ).isRequired,
  onClientClick: PropTypes.func,
};

OverdueRenewalsModal.defaultProps = {
  onClientClick: null,
};

export default OverdueRenewalsModal;

