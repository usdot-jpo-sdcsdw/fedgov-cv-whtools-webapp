package gov.dot.its.jpo.sdcsdw.whtoolswebapp;

import java.util.Enumeration;

import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConfigurableFilterAdapter
{
    
    private static final Logger LOGGER = LoggerFactory.getLogger(ConfigurableFilterAdapter.class);
    
    private static String convertInitParameter(final String value) {
        if (value == null) {
            LOGGER.debug("Ignoring null parameter");
            return "";
        } else if (value.startsWith("${") && value.endsWith("}")) {
            final String propertyName = value.substring(2, value.length() - 1);
            final String propertyValue = System.getProperty(propertyName);
            if (propertyValue == null) {
                LOGGER.debug("Looked up missing property " + propertyName);
                return "";
            } else {
                LOGGER.debug("Looked up property " + propertyName + " and got value " + propertyValue);
                return propertyValue;
            }
        } else {
            LOGGER.debug("Ignoring literal " + value);
            return value;
        }
    }
    
    public interface HasInit {
        public void init(final FilterConfig filterConfig) throws ServletException;
    }
    
    public static void init(HasInit super_, final FilterConfig filterConfig) throws ServletException {
        
        super_.init(new FilterConfig() {

            @Override
            public String getFilterName()
            {
                return filterConfig.getFilterName();
            }

            @Override
            public ServletContext getServletContext()
            {
                return filterConfig.getServletContext();
            }

            @Override
            public String getInitParameter(String name)
            {
                LOGGER.debug("Asked for parameter " + name);
                return convertInitParameter(filterConfig.getInitParameter(name));
            }

            @Override
            public Enumeration getInitParameterNames()
            {
                LOGGER.debug("Asked for all parameter names");
                return filterConfig.getInitParameterNames();
            }
            
        });
    }
}
