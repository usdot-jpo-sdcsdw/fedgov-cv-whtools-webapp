$(document).ready(function() {
    $('.result-form').bootstrapValidator({
    	container: 'tooltip',
        message: 'This value is not valid',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            limit: {
                message: 'The number is not valid',
                validators: {
                    notEmpty: {
                        message: 'The limit is required.'
                    },
                    between: {
                    	min: 1,
                    	max: 2500,
                        message: 'The limit must be between 1-2500.'
                    }
                }
            },
            skip: {
                message: 'The number is not valid',
                validators: {
                    notEmpty: {
                        message: 'A number is required.'
                    },
                    digits: {
                        message: 'Skip can contain digits only'
                    }
                }
            },
            nwLat: {
                message: 'The latitude is not valid',
                validators: {
                	notEmpty: {
                         message: 'A bound is required.'
                     },
                    between: {
                    	min: -90,
                    	max: 90,
                        message: 'The latitude must be between -90.0 and 90.0.'
                    }
                }
            },
            nwLon: {
                message: 'The longitude is not valid',
                validators: {
                	notEmpty: {
                        message: 'A bound is required.'
                    },
                    between: {
                    	min: -180,
                    	max: 180,
                        message: 'The longitude must be between -180.0 and 180.0.'
                    }
                }
            },
            seLat: {
                message: 'The latitude is not valid',
                validators: {
                	notEmpty: {
                        message: 'A bound is required.'
                    },
                    between: {
                    	min: -90,
                    	max: 90,
                        message: 'The latitude must be between -90.0 and 90.0.'
                    }
                }
            },
            seLon: {
                message: 'The longitude is not valid',
                validators: {
                	notEmpty: {
                        message: 'A bound is required.'
                    },
                    between: {
                    	min: -180,
                    	max: 180,
                        message: 'The longitude must be between -180.0 and 180.0.'
                    }
                }
            },  
        }
    });
});


