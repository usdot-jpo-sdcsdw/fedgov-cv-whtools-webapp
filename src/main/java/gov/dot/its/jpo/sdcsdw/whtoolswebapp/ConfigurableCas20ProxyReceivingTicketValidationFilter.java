package gov.dot.its.jpo.sdcsdw.whtoolswebapp;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.jasig.cas.client.validation.Cas20ProxyReceivingTicketValidationFilter;

public class ConfigurableCas20ProxyReceivingTicketValidationFilter implements Filter
{
    
    Cas20ProxyReceivingTicketValidationFilter internal = new Cas20ProxyReceivingTicketValidationFilter();
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException
    {
        ConfigurableFilterAdapter.init(internal::init, filterConfig);
    }

    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain) throws IOException, ServletException
    {
        internal.doFilter(request, response, chain);
    }

    @Override
    public void destroy()
    {
        internal.destroy();
    }
    
}
